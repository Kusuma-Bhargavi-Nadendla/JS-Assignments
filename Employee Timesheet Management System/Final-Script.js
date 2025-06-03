const activityTaskOptions = {
    "Training": ["Doubt clarification", "Self Learning", "Assignment", "Session", "Training preparation", "1:1 Discussion"],
    "Break": ["Lunch", "Snacks", "Personal Reasons", "Others"],
    "HR Activities": ["Employee Engagement", "Celebration events", "All hands meet", "Others"],
    "COE": ["Training", "POC", "Accelerators", "Audit", "Others"],
    "Miscellaneous": ["Miscellaneous"]
}


const myRowTemplate = document.getElementById("row-div-template");
const entriesContainer = document.getElementById("time-sheet-entries");
const clockInBtn=document.getElementById("clock-in");
const clockOutBtn=document.getElementById("clock-out");


var entryCount=1;
function addRow() {
    let rowTemplate = myRowTemplate.content.cloneNode(true);
    let row=rowTemplate.querySelector('.time-sheet-entry');
    row.id = "entry-" + entryCount;
    entryCount+=1;
    entriesContainer.appendChild(row);

    addListenersEntry(row);
    return row;
}

document.getElementById("add-new-entry").addEventListener("click", ()=>{
    addRow();
    if(saveBtn.disabled){
        document.getElementById("time-sheet-entries").dispatchEvent(new Event("change"));
    }
}
);

document.addEventListener("DOMContentLoaded",function(){ 
    var savedState=localStorage.getItem("timeSheetState");
    console.log("Saved Timesheet:",savedState);

    if(savedState===null){
        document.getElementById("time-sheet").innerHTML="Clock-In to view Timesheet";
        document.querySelector(".timesheet-overview").innerHTML="";
    }else{
        loadTimeSheetFromJSON();
    }

    let currentStatus=localStorage.getItem("inOutStatus");
    
    if(currentStatus==null || currentStatus=="Out"){
        clockInBtn.disabled=false;
        clockOutBtn.disabled=true;
    }else {
        clockInBtn.disabled=true;
        clockOutBtn.disabled=false;
    }

    calculateBiometricHours();
    updateTimesheetHoursSummary();

    if(localStorage.getItem("biometricIn")!=null){
        document.getElementById("biometric-in").textContent=localStorage.getItem("biometricIn");
    }
    if(localStorage.getItem("biometricOut")!=null){
        document.getElementById("biometric-out").textContent=localStorage.getItem("biometricOut");
    }

    if(localStorage.getItem("submitStatus")=="Submited"){
        submitTimesheet();
    }
    

});
// document.querySelector("#clearLog").addEventListener("click",()=>{localStorage.clear()});



function loadTimeSheetFromJSON(){
    savedState=localStorage.getItem("timeSheetState");
    timesheetArray=JSON.parse(savedState);

    entriesContainer.innerHTML='';
    for(rowId in timesheetArray){
        const row=timesheetArray[rowId];
        // console.log(row,timesheetArray[rowId]);
        newRow=addRow();
        newRow.querySelector(".type img").src=row.type;
        newRow.querySelector(".activity select").value=row.activity;


        let activityTasks = activityTaskOptions[row.activity];
            let taskSelect = document.createElement('select');

            activityTasks.forEach(task => {
                let option = document.createElement('option');
                option.textContent = task;
                taskSelect.appendChild(option);
            });

            let taskParent = newRow.querySelector(".task");
            taskParent.innerHTML = '';
            taskParent.appendChild(taskSelect);

            taskSelect.value = row.task;

    newRow.querySelector("textarea").textContent=row.taskDetails;
    newRow.querySelector(".task-details-limit").textContent=row.taskDetailsLength+"/255";
    newRow.querySelector(".start-time .recorded-time-data").textContent=row.startTime;
    newRow.querySelector(".end-time .recorded-time-data").textContent=row.endTime;
    newRow.querySelector(".duration-data").textContent=row.duration;

    }
}


function addListenersEntry(row){
    
    //Activity Task Listener
    row.querySelector(".activity select").addEventListener("change",activityTaskListener);


    // Task Details Listener
    const taskDetailsDiv=row.querySelector(".task-details");
    const limitCheck=taskDetailsDiv.querySelector(".task-details-limit");
    const taskDetailsTextArea=taskDetailsDiv.querySelector("textarea");
    taskDetailsDiv.addEventListener("input",(e)=>{   
        limitCheck.textContent=(e.target.value.length)+"/255";    
    });
    taskDetailsTextArea.addEventListener("blur",TaskDetailsErrorMessageListener);

    const startTimeDiv=row.querySelector(".start-time");
    const endTimeDiv=row.querySelector(".end-time");
    const startDataDiv=startTimeDiv.querySelector(".start-end-duration");
    const endDataDiv=endTimeDiv.querySelector(".start-end-duration");
    
    startDataDiv.addEventListener("click",openTimerEntryListener);
    endDataDiv.addEventListener("click",openTimerEntryListener);

    updateRecordedTimeListener(startTimeDiv);
    updateRecordedTimeListener(endTimeDiv);

    //Removing entry
    
    row.querySelector(".deleteEntry").addEventListener("click",deleteRowFunction);

    //Split entry
    row.querySelector(".splitEntry").addEventListener("click",splitRowFunction);


}

// Buttons listener in Mod timer
 function updateRecordedTimeListener(timerDiv){
    // console.log(timerDiv);
    const recordedDataDiv=timerDiv.querySelector(".recorded-time-data");
    const modTimerDiv=timerDiv.querySelector(".time-sheet-entry-timer");
    const curValue=recordedDataDiv.textContent.trim();
    let hrs,mins,noon,totalMins;
    if(curValue!="Start time" && curValue!="End time"){
        [hrs,mins,noon,totalMins]=findMinutesFromData(recordedDataDiv.textContent.trim());
    }else{
        [hrs,mins,noon,totalMins]=getCurrentTime();
    }

    // console.log(modTimerDiv);
    modTimerDiv.addEventListener("click",(e)=>{
        const target=e.target;
        const parentNode=target.parentNode;

        if(parentNode.classList.contains("hours")){
            if(target.classList.contains("up")){
                hrs=(hrs==12)?1:hrs+1;
            }
            else if(target.classList.contains("down")){
                hrs=(hrs==1)?12:hrs-1;
            }
            parentNode.querySelector(".hours input").value=hrs;

        }
        else if(parentNode.classList.contains("minutes")){

            if(target.classList.contains("up")){
                mins=(mins==59)?0:mins+1;
            }
            else if(target.classList.contains("down")){
                mins=(mins==0)?59:mins-1;
            }
            parentNode.querySelector(".minutes input").value=mins;
        }
        else{
            noon=(noon=="AM")?"PM":"AM";
            parentNode.querySelector(".am-pm input").value=noon;
        }

        
        // console.log(hrs,mins,noon,totalMins);
        recordedDataDiv.textContent=hrs+" : "+mins+" "+noon;

        validateTimers(e.target.closest(".time-sheet-entry"));


        calculateDuration(target.closest(".time-sheet-entry"));

    });

    modTimerDiv.addEventListener("change",(e)=>{
        const target=e.target;
        const parentNode=target.parentNode;

        hrs=modTimerDiv.querySelector(".hours input").value%12;

        mins=modTimerDiv.querySelector(".minutes input").value%60;

        recordedDataDiv.textContent=hrs+" : "+mins+" "+noon;

        validateTimers(e.target.closest(".time-sheet-entry"));


        calculateDuration(target.closest(".time-sheet-entry"));


    });
    
    // timerDiv.querySelector(".timer-error-message").classList.add("hidden"); // Remove error if exists
    // timerDiv.querySelector(".start-end-duration").style.borderBottom="1px solid var(--webpage-blue)"
 }

// Validate Entries

function validateTimers(row){
    const startTimeDiv=row.querySelector(".start-time");
    const startData=startTimeDiv.querySelector(".recorded-time-data").textContent.trim();
    const startErrorMsgDiv=startTimeDiv.querySelector(" .timer-error-message");


    const endTimeDiv=row.querySelector(".end-time");
    const endData=endTimeDiv.querySelector(".recorded-time-data").textContent.trim();
    const endErrorMsgDiv=endTimeDiv.querySelector(" .timer-error-message");

    if(startData!="Start time" && endData!="End time"){

            const startMins=findMinutesFromData(startData);
            const endMins=findMinutesFromData(endData);
            // console.log(startData,endData,startMins,endMins);

            // Same entry compare
            if(startMins[3]>endMins[3]){
                endErrorMsgDiv.classList.remove("hidden");
            }else{
                endErrorMsgDiv.classList.add("hidden");
            }
    }

    // Previous entry compare
    if(row.previousElementSibling){
        const prevRow=row.previousElementSibling;

        const prevEndTimeDiv=prevRow.querySelector(".end-time");
        const prevEndData=prevEndTimeDiv.querySelector(".recorded-time-data").textContent.trim();
        const prevEndErrorMsgDiv=prevEndTimeDiv.querySelector(" .timer-error-message");

        if(startData!="Start time" && prevEndData!="End time"){
            const startMins=findMinutesFromData(startData);
            const prevEndMins=findMinutesFromData(prevEndData);
            
            if(startMins[3]<prevEndMins[3]){
                startErrorMsgDiv.classList.remove("hidden");
                if(prevEndErrorMsgDiv.classList.contains("hidden")){
                    prevEndErrorMsgDiv.classList.remove("hidden");   //   Don't override
                }
            }else{
                startErrorMsgDiv.classList.add("hidden");
                prevEndErrorMsgDiv.classList.remove("hidden");
                validateTimers(prevRow);  // Check their errors
            }
        }

    }

    
}

// Update Duration for each entry

function calculateDuration(entryDiv){
    
    const durationDiv=entryDiv.querySelector(".duration");
    const startData=entryDiv.querySelector(".start-time").querySelector(".recorded-time-data").textContent;
    var totalStartMinutes=totalEndMinutes=0, startMinsResult,endMinsResult;

    if(startData.trim()!="Start time"){
        startMinsResult=findMinutesFromData(startData.trim());
        totalStartMinutes=startMinsResult[3];
    }

    const endData=entryDiv.querySelector(".end-time").querySelector(".recorded-time-data").textContent;

    if(endData.trim()!="End time"){
        endMinsResult=findMinutesFromData(endData.trim());
        totalEndMinutes=endMinsResult[3];
    }
    
    
    if(startData.trim()!="Start time" && endData.trim()!="End time"){
    
        totalHours = endMinsResult[0] - startMinsResult[0];
        totalMinutes = endMinsResult[1] - startMinsResult[1];
        if (totalMinutes < 0) {
            totalMinutes += 60;
            totalHours -= 1;
        }
        durationDiv.querySelector(".duration").querySelector(".duration-data").textContent=totalHours +"h "+totalMinutes+"m";
    }
    updateTimesheetHoursSummary();
    
}

// Open Mod timer on click
function openTimerEntryListener(e){
    
    let currEntryDiv=e.currentTarget.nextElementSibling;
    currEntryDiv.classList.toggle("hidden");
    if(activeTimer){
        activeTimer.classList.add("hidden");
    }
    if(currEntryDiv.classList.contains("hidden")){
        activeTimer=null;
    }else{
        activeTimer=currEntryDiv;

        let curDiv=e.currentTarget.querySelector(".recorded-time-data");
        const curValue=curDiv.textContent.trim();
        let hrs,mins,noon,totalMins;
        if(curValue!="Start time" && curValue!="End time"){
            [hrs,mins,noon,totalMins]=findMinutesFromData(curDiv.textContent.trim());
            if(hrs>12){
                hrs-=12;
            }
        }else{
            [hrs,mins,noon,totalMins]=getCurrentTime();
        }
        currEntryDiv.querySelector(".hours input").value=hrs;
        currEntryDiv.querySelector(".minutes input").value=mins;
        currEntryDiv.querySelector(".am-pm input").value=noon;

    }
}

activeTimer=null;

// Close Mod Timer if not req
document.addEventListener("click", (e) => {
    const target = e.target;
    const timerElement = target.closest(".time-sheet-entry-timer");
 
    const targetCl=target.classList;
    if (targetCl.contains("start-end-duration") || targetCl.contains("recorded-time-data")||targetCl.contains("target-clock-logo")) {
        return;
    }
 
    if (timerElement) {
        return;
    }
 
    if (activeTimer) {
        activeTimer.classList.add("hidden");
        activeTimer = null;
    }
});

// Change Tasks according to Activity selected
function activityTaskListener(e){
    
    const activityNode=e.target.closest(".activity");
    const selectedActivity=e.target.value;
    const typeImgLogo = activityNode.previousElementSibling.querySelector("img");
    if (selectedActivity === "Break") {
        typeImgLogo.src = "https://apps.pal.tech/hrms/assets/images/break-activity.png";
        const taskDetailsDiv=activityNode.nextElementSibling.nextElementSibling;
        taskDetailsDiv.querySelector(".task-details-error-message").style.visibility="hidden";
        taskDetailsDiv.querySelector("textarea").style.borderBottom="1px solid var(--webpage-blue)"
    } else {
        typeImgLogo.src = "https://apps.pal.tech/hrms/assets/images/activity-type.png";
    }

    const activityTasks = activityTaskOptions[selectedActivity];
    
    const taskSelect = document.createElement('select');

    activityTasks.forEach(task => {
        const option = document.createElement('option');
        option.textContent = task;
        taskSelect.appendChild(option);
    });

    const taskParent = activityNode.nextElementSibling;
    taskParent.innerHTML = '';
    taskParent.appendChild(taskSelect);

    updateTimesheetHoursSummary();
}


// Check Task Details limit and display error
function TaskDetailsErrorMessageListener(e){
    const taskDetailsDiv=e.target.closest(".task-details");
    const activityDiv=taskDetailsDiv.previousElementSibling.previousElementSibling;
    if(activityDiv.querySelector("select").value ==="Break"){
            taskDetailsDiv.querySelector(".task-details-error-message").style.visibility="hidden";
            e.target.style.borderBottom = "1px solid var(--webpage-blue)";
    }
    else{
        if(e.target.value===""){
            taskDetailsDiv.querySelector(".task-details-error-message").style.visibility="visible";
            e.target.style.borderBottom = "1px solid red";
        }else{
            taskDetailsDiv.querySelector(".task-details-error-message").style.visibility="hidden";
            e.target.style.borderBottom = "1px solid var(--webpage-blue)"; 
        }
    }
}

// Split entry to 2 parts
function splitRowFunction(e){
    let row=e.target.closest(".time-sheet-entry");
    splitEntryListener(row);
}
function splitEntryListener(row){

    const startTimeDiv=row.querySelector(".start-time .start-end-duration");
    const startData=startTimeDiv.querySelector(".recorded-time-data").textContent;

    const endTimeDiv=row.querySelector(".end-time .start-end-duration");
    const endDataDiv=endTimeDiv.querySelector(".recorded-time-data");

    if(startData.trim()=="Start time" || endDataDiv.textContent.trim()=="End time"){
        return;
    }

    let rowTemplate = myRowTemplate.content.cloneNode(true);
    let newSplitrow=rowTemplate.querySelector('.time-sheet-entry');
    newSplitrow.id = "entry-" + entryCount;
    entryCount+=1;
    
    if(row===entriesContainer.lastElementChild){
        entriesContainer.appendChild(newSplitrow);
    }else{
        const nextEntry=row.nextElementSibling;
        entriesContainer.insertBefore(newSplitrow,nextEntry);
    }
    newSplitrow.querySelector(".activity select").value=row.querySelector(".activity select").value;
    addListenersEntry(newSplitrow);

    // Second row - End time
    const newEndTimeDiv=newSplitrow.querySelector(".end-time").querySelector(".start-end-duration");
    newSplitrow.querySelector(".activity select").dispatchEvent(new Event("change"));


    const newEndDataDiv=newEndTimeDiv.querySelector(".recorded-time-data");
    newEndDataDiv.textContent=endDataDiv.textContent;

    // if(startData.trim()!="Start time"){
        const minResult=findMinutesFromData(startData.trim());
        
        minResult[0]=(minResult[0]>12)?(minResult[0]-12):minResult[0];
        const newSM=parseInt(minResult[1])+1;
        const newEndTimeCurEntry=minResult[1]+1;
        console.log(minResult);

        // First row - End time
        endDataDiv.textContent=minResult[0]+" : "+newEndTimeCurEntry+" "+minResult[2];

        // Second row - Start time
        const newStartTimeDiv=newSplitrow.querySelector(".start-time .start-end-duration");
        const newStartDataDiv=newStartTimeDiv.querySelector(".recorded-time-data");
        newStartDataDiv.textContent=endDataDiv.textContent;
    // }

    calculateDuration(row);
    calculateDuration(newSplitrow);

    if(saveBtn.disabled){
        document.getElementById("time-sheet-entries").dispatchEvent(new Event("change"));
    }
}

// To delete Row entries
var rowToDelete=null;
const deleteWarning=document.querySelector("#deleteEntryWarning");

function deleteRowFunction(e){
    if(entriesContainer.childElementCount>1){
        deleteWarning.classList.remove("hidden");
        rowToDelete=e.target.closest(".time-sheet-entry");
    }
}

document.getElementById("confirmDeleteEntry").addEventListener("click",()=>{
    deleteEntry();
    deleteWarning.classList.add("hidden");
});
document.getElementById("cancelDeletingEntry").addEventListener("click",()=>{
    deleteWarning.classList.add("hidden");
});
document.getElementById("close-btn").addEventListener("click",()=>{
    deleteWarning.classList.add("hidden");
});

// To delete Entry
function deleteEntry(){
    if(rowToDelete){
        let prevRow=rowToDelete.previousElementSibling;
        let nextRow=rowToDelete.nextElementSibling;
        entriesContainer.removeChild(rowToDelete);
        if(prevRow){
            validateTimers(prevRow);
        }
        if(nextRow){
            validateTimers(nextRow);
        }
        rowToDelete=null;
        
    }
    if(saveBtn.disabled){
        document.getElementById("time-sheet-entries").dispatchEvent(new Event("change"));
    }
    updateTimesheetHoursSummary();
}


// Update Timesheet Hours
function updateTimesheetHoursSummary(){
    // console.log("updated summary");
    var effectiveMinutes=breakMinutes=0;
    Array.from(entriesContainer.children).forEach(row=>{
        let data=row.querySelector(".duration-data").textContent.trim();
        let [hrs, mins] = data.split(" ");
        hrs=parseInt(hrs.substring(0,hrs.length-1));
        mins=parseInt(mins.substring(0,mins.length-1));
        if(row.querySelector(".activity select").value=="Break"){
            breakMinutes+=mins;
            breakMinutes+=hrs*60;
        }else{
            effectiveMinutes+=mins;
            effectiveMinutes+=hrs*60;
        }
    });
    const effectiveHours=document.querySelector(".total-recorded-effective-hours");
    effectiveHours.textContent=Math.floor(effectiveMinutes / 60)+"h "+(effectiveMinutes % 60)+"m";
    const breakHours=document.querySelector(".total-recorded-break-hours");
    breakHours.textContent=Math.floor(breakMinutes/60)+"h "+(breakMinutes%60)+"m";
    return [effectiveMinutes,breakMinutes];
}


function calculateBiometricHours(){
    let clockInStorage=JSON.parse(localStorage.getItem("Clock-In-Data"));
    let clockOutStorage=JSON.parse(localStorage.getItem("Clock-Out-Data"));
    
    if(clockInStorage==null || clockOutStorage==null){
        return ;
    }
    let entryCount=clockInStorage.length;
    let totalBiometricEffMins=totalBiometricBreakMins=0;
    let prevEntryMins=-1;

    for(let i=0;i<entryCount-1;i++){
        let inData=clockInStorage[i][0]+" : "+clockInStorage[i][1]+" "+clockInStorage[i][2];
        // console.log(inData);
        let inResObj=findMinutesFromData(inData);
        let inMins=inResObj[3];

        let outData=clockOutStorage[i][0]+" : "+clockOutStorage[i][1]+" "+clockOutStorage[i][2];
        // console.log(outData);
        let outResObj=findMinutesFromData(outData);
        let outMins=outResObj[3];

        totalBiometricEffMins+=(outMins-inMins);
        if(prevEntryMins==-1){
            prevEntryMins=outMins;
        }else{
            totalBiometricBreakMins+=(inMins-prevEntryMins);
        }
        // console.log('ffff',totalBiometricEffMins,totalBiometricBreakMins);
        // console.log('fffddd',inMins,inData,outMins,outData);

    }
    let curTime=getCurrentTime();
    let curMins=findMinutesFromData(curTime[0]+" : "+curTime[1]+" "+curTime[2])[3];
    let inData=clockInStorage[entryCount-1][0]+" : "+clockInStorage[entryCount-1][1]+" "+clockInStorage[entryCount-1][2];
    // console.log(inData);
    let inMins=findMinutesFromData(inData)[3];
    totalBiometricEffMins+=(curMins-inMins);

    const [effHr,effMin]=[Math.floor(totalBiometricEffMins/60),totalBiometricEffMins%60];
    const [breakHr,breakMin]=[Math.floor(totalBiometricBreakMins/60),totalBiometricBreakMins%50];

    document.querySelector(".biometric.effective-hours").textContent=effHr+"h :"+effMin+"m";
    document.querySelector(".biometric.break-hours").textContent=breakHr+"h :"+breakMin+"m";
    // console.log("Biometric:",effHr,effMin,breakHr,breakMin);

}

//Current Time object
function getCurrentTime(){
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const isNoon = hours >= 12 ? 'PM' : 'AM';
    hours=(isNoon==='PM')?(hours-12):hours;
    if(hours==0){
        hours=12;
    }
    return [hours,minutes,isNoon];

}

// Find minues from Recorded Data
function findMinutesFromData(recordedData){

    var Hours,Mins,Noon,totalMinutes;
        [Hours,temp]=recordedData.split(":");
    
        [Mins,Noon]=temp.trim().split(" ");
        // console.log(startHours,startMins,startNoon);

        Hours=parseInt(Hours);
        Mins=parseInt(Mins);
        if(Noon==="PM"&&Hours<12){Hours+=12;}
        if(Noon==="AM" &&Hours===12){Hours=0;}
        totalMinutes=Hours*60+Mins;
    return [Hours,Mins,Noon,totalMinutes];
}

// Handle Cancel Changes
const cancelWarning=document.querySelector("#cancelChangesWarning");

document.getElementById("cancelChanges").addEventListener("click",()=>{
    cancelWarning.classList.remove("hidden");        
});
document.getElementById("confirmCancelChanges").addEventListener("click",()=>{
    loadTimeSheetFromJSON();
    cancelWarning.classList.add("hidden");
});
document.getElementById("undoCancelChanges").addEventListener("click",()=>{
    cancelWarning.classList.add("hidden");
});
document.querySelector(".close-btn.cancel").addEventListener("click",()=>{
    cancelWarning.classList.add("hidden");
});


// Handle Submit Changes
const submitWarning=document.querySelector("#submitChangesWarning");

document.getElementById("submitTimesheet").addEventListener("click",()=>{
    submitWarning.classList.remove("hidden");        
});
document.getElementById("confirmSubmitChanges").addEventListener("click",()=>{
    if(validateTimesheet()){
        submitTimesheet();
       
    }
    submitWarning.classList.add("hidden");
});
document.getElementById("undoSubmitChanges").addEventListener("click",()=>{
    submitWarning.classList.add("hidden");
});
document.querySelector(".close-btn.submit").addEventListener("click",()=>{
    submitWarning.classList.add("hidden");
});

// Save changes to Local storage
document.getElementById("saveChanges").addEventListener("click",validateTimesheet);

function validateTimesheet(){
    valid=true;
    Array.from(entriesContainer.children).forEach(row=>{
        let taskDetailsDiv=row.querySelector(".task-details textarea");
        if(row.querySelector(".activity select").value !="Break" && taskDetailsDiv.value.trim()==""){
            row.querySelector(".task-details-error-message").style.visibility="visible";
            taskDetailsDiv.style.borderBottom="1px solid red";
            valid=false;
        }
        let startTimerData=row.querySelector(".start-time .recorded-time-data").textContent;
        if(startTimerData.trim()==="Start time"){
            let errorMsgDiv=row.querySelector(".start-time .timer-error-message");
            errorMsgDiv.classList.remove("hidden");
            errorMsgDiv.textContent="This field is required";
            row.querySelector(".start-time .start-end-duration").style.borderBottom="1px solid red";
            valid=false;
        }
        let endTimer=row.querySelector(".end-time .recorded-time-data");
        if(endTimer.textContent.trim()==="End time"){
            let errorMsgDiv=row.querySelector(".end-time .timer-error-message");
            errorMsgDiv.textContent="This field is required";
            errorMsgDiv.classList.remove("hidden");
            row.querySelector(".end-time .start-end-duration").style.borderBottom="1px solid red";
            valid=false;
        }
        
    });
    if(valid){
        saveChangesTimesheetJSONLocalStorage();
        saveBtn.disabled=true;
    }
    return valid;
}



// Function to save changes
function saveChangesTimesheetJSONLocalStorage(){
    const curTimesheetState={};
    let entryCount=1;
    
    Array.from(entriesContainer.children).forEach(row=>{
        let rowState={
            type:row.querySelector(".type img").src,
            activity:row.querySelector(".activity select").value,
            task:row.querySelector(".task select").value,
            taskDetails:row.querySelector(".task-details textarea").value,
            taskDetailsLength:row.querySelector(".task-details textarea").value.length,
            startTime:row.querySelector(".start-time .recorded-time-data").textContent,
            endTime:row.querySelector(".end-time .recorded-time-data").textContent,
            duration:row.querySelector(".duration-data").textContent
        }
        curTimesheetState[entryCount]=rowState;
        entryCount+=1;

    });
    console.log(curTimesheetState);
    localStorage.setItem("timeSheetState",JSON.stringify(curTimesheetState));

}


//Save button enable
const saveBtn=document.getElementById("saveChanges");
document.getElementById("time-sheet-entries").addEventListener("change",()=>{
    // console.log("Change fired");
    if(saveBtn.disabled){ saveBtn.disabled=false; }
});

document.querySelector(".write-comment textarea").addEventListener("change",()=>{
    if(saveBtn.disabled){
        document.getElementById("time-sheet-entries").dispatchEvent(new Event("change"));
    } 
})

// Submit Timesheet
function submitTimesheet(){
    let biometricEffData=document.querySelector(".biometric.effective-hours").textContent.trim();
    let biometricEffRes=findMinutesFromData(biometricEffData);
    let comment=document.querySelector(".write-comment textarea").value;

    let [effMins,breakMins]=updateTimesheetHoursSummary();
    // console.log("Biometric:",biometricEffRes,"User:",effMins);
    if(effMins>biometricEffRes[3]+30 && comment.trim()==""){
        document.querySelector(".write-comment-error-message").style.visibility="visible";
    }else{
        document.querySelector(".write-comment-error-message").style.visibility="hidden";
        document.getElementById("cancelChanges").disabled=true;
        document.getElementById("saveChanges").disabled=true;
        document.getElementById("submitTimesheet").disabled=true;
        clockInBtn.disabled=true;
        clockOutBtn.disabled=true;

        document.querySelectorAll("select").forEach(selectDiv=>{selectDiv.disabled=true; });
        document.querySelectorAll("textarea").forEach(textareaDiv=>{textareaDiv.disabled=true; });
        document.querySelectorAll(".start-end-duration").forEach(timerDiv=>{ timerDiv.onclick=null; });
        document.querySelectorAll(".start-end-duration").forEach(timerDiv=>{
            // timerDiv=>timerDiv.removeEventListener("click",addModTimertoDiv);
            // timerDiv.onclick=null;
            timerDiv.style.pointerEvents = "none";
            });

        document.querySelectorAll(".deleteEntry").forEach(deleteEntryDiv=>deleteEntryDiv.removeEventListener("click",deleteRowFunction));

        document.querySelectorAll(".splitEntry").forEach(splitEntryDiv=>splitEntryDiv.removeEventListener("click",splitRowFunction));

        document.getElementById("add-new-entry").removeEventListener("click", addRow);
        document.getElementById("add-new-entry").style.display="none";

        saveChangesTimesheetJSONLocalStorage();

        document.querySelector("h3 span").classList.add("submit");
        document.querySelector("h3 span").textContent="Submitted";


        localStorage.setItem("submitStatus","Submited");
    }
}

const biometricInDiv=document.getElementById("biometric-in");
const biometricOutDiv=document.getElementById("biometric-out");

clockInBtn.addEventListener("click",()=>{
    let clockInStorage=JSON.parse(localStorage.getItem("Clock-In-Data"));
    
    if(clockInStorage===null){
        clockInStorage=[];
        let [hrs,mins,noon]=getCurrentTime();
        clockInStorage.push([hrs,mins,noon]);
        localStorage.setItem("Clock-In-Data",JSON.stringify(clockInStorage));

        let newRow=addRow();
        newRow.querySelector(".start-time .recorded-time-data").textContent=hrs+" : "+mins+" "+noon;

        saveChangesTimesheetJSONLocalStorage(); // Auto-save timesheet
        biometricInDiv.textContent=hrs+" : "+mins+" "+noon;
        localStorage.setItem("biometricIn",hrs+" : "+mins+" "+noon);
        
    }else{

        let outStorage=JSON.parse(localStorage.getItem("Clock-Out-Data"));
        console.log(outStorage);
        let prevOut=outStorage[outStorage.length-1];


        let newBreakRow=addRow();
        newBreakRow.querySelector(".activity select").value="Break";
        newBreakRow.querySelector(".activity select").dispatchEvent(new Event("change"));

        
        // Prev row - End time
        newBreakRow.previousElementSibling.querySelector(".end-time .recorded-time-data").textContent=prevOut[0]+" : "+prevOut[1]+" "+prevOut[2];
        
        calculateDuration(newBreakRow.previousElementSibling);

        // Current row - Start time
        newBreakRow.querySelector(".start-time .recorded-time-data").textContent=prevOut[0]+" : "+prevOut[1]+" "+prevOut[2];

        let [hrs,mins,noon]=getCurrentTime();
        newBreakRow.querySelector(".end-time .recorded-time-data").textContent=hrs+" : "+mins+" "+noon;
        calculateDuration(newRow);

        let newEffectiveRow=addRow();
        newEffectiveRow.querySelector(".start-time .recorded-time-data").textContent=hrs+" : "+mins+" "+noon;

        clockInStorage.push([hrs,mins,noon]);
        localStorage.setItem("Clock-In-Data",JSON.stringify(clockInStorage));
        saveChangesTimesheetJSONLocalStorage(); // Auto-save
    }
    clockInBtn.disabled=true;
    clockOutBtn.disabled=false;
    localStorage.setItem("inOutStatus","In");

    location.reload();

});

clockOutBtn.addEventListener("click",()=>{
    let clockOutStorage=JSON.parse(localStorage.getItem("Clock-Out-Data"));
    
    if(clockOutStorage===null){
        clockOutStorage=[]; 
    }
    let [hrs,mins,noon]=getCurrentTime();
    clockOutStorage.push([hrs,mins,noon]);
    localStorage.setItem("Clock-Out-Data",JSON.stringify(clockOutStorage));
    
    clockInBtn.disabled=false;
    clockOutBtn.disabled=true;
    localStorage.setItem("inOutStatus","Out");
    biometricOutDiv.textContent=hrs+" : "+mins+" "+noon;
    localStorage.setItem("biometricOut",hrs+" : "+mins+" "+noon);
})
