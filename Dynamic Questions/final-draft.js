document.addEventListener("DOMContentLoaded", () => {

    const currentQuestions = JSON.parse(localStorage.getItem("currentQuestions"));

    const devQuestionsContainer = document.querySelector(".questions-list");
    const userQuestionsContainer = document.querySelector(".questions-preview-list");

    if (!currentQuestions) {
        devQuestionsContainer.innerHTML = "Start adding questions...";
        userQuestionsContainer.innerHTML = "Add questions and save to preview";

    } else {
        loadQuestionsFromJSON();
        loadPreviewfromJSON();
    }
});

function loadQuestionsFromJSON() {
    const devQuestionsContainer = document.querySelector(".questions-list");

    devQuestionsContainer.innerHTML = "";
    const currentQuestions = JSON.parse(localStorage.getItem("currentQuestions"));

    console.log("loaded",currentQuestions);

    for(quesCnt in currentQuestions){
        const quesDiv=currentQuestions[quesCnt];
        const question=addQuestion();
        question.querySelector(".question-type-dropdown select").value=quesDiv.questionType;

        fireDummyChangeEvent(question);
        question.querySelector(".question-text").textContent=quesDiv.userQuestion;
        question.querySelector(".question-content").innerHTML=quesDiv.questionEditableHTML;

        if(quesDiv.questionType==="dropdown-single" || quesDiv.questionType==="dropdown-multiple"){
            let optionsList=quesDiv.questionContent;
            let contentSelectDiv=question.querySelector(".question-content");
            contentSelectDiv.innerHTML="";

            newQuestionTypeDiv = document.createElement("div");
            newQuestionTypeDiv.classList.add("question-type-select");
            let dropdownSelectDiv = document.createElement("select");
            dropdownSelectDiv.classList.add("dropdown-select-content");
            let addNewBtn = document.createElement("button");
            addNewBtn.classList.add("add-new-option-dropdown");
            addNewBtn.textContent = "Add new option";
            newQuestionTypeDiv.appendChild(addNewBtn);

            contentSelectDiv.appendChild(newQuestionTypeDiv);

            addDropDownListener(newQuestionTypeDiv,true,optionsList);
        }else{
            question.querySelector(".question-content").innerHTML=quesDiv.questionEditableHTML;
        }
        question.querySelector(".is-required").checked=quesDiv.isRequired;

        if(quesDiv.isMaxLengthReq){
            question.querySelector(".max-length-question input").value=quesDiv.maxLength;
            addMaxLengthListener(question);
        }else{
             question.querySelector(".max-length-question").innerHTML="";

        }
        if(quesDiv.isRangeRequired){
            question.querySelector(".range-question").innerHTML=quesDiv.rangeObj;
            question.querySelector(".range-question .start-range").value=quesDiv.rangeMin;
            question.querySelector(".range-question .end-range").value=quesDiv.rangeMax;
            addRangeValidateListener(question);
            
        }else{
            question.querySelector(".range-question").innerHTML="";
        }
    }
}

document.querySelector(".add-new-question").addEventListener("click", () => {

    if (devQuestionsContainer.innerHTML == "Start adding questions...") {
        devQuestionsContainer.innerHTML = "";
    }
    let ques=addQuestion();
    fireDummyChangeEvent(ques);
});


let questionCount = 1;
const devQuestionsContainer = document.querySelector(".questions-list");

function addQuestion() {
    const templateDiv = document.querySelector("#question-template");
    const newQuestionTemplate = templateDiv.content.cloneNode(true);
    let question = newQuestionTemplate.querySelector(".question-container");
    question.id = "question-" + questionCount;
    questionCount += 1;
    devQuestionsContainer.appendChild(question);
    addListenersToQuestionDiv(question);
    return question;
}
function fireDummyChangeEvent(questionDiv){
    questionDiv.querySelector(".question-type-dropdown").dispatchEvent(new Event("change"));
}
let draggedItem = null;
function addListenersToQuestionDiv(questionDiv) {
    questionDiv.querySelector(".question-type-dropdown").value = "Text";
    questionDiv.querySelector(".question-type-dropdown").addEventListener("change", questionTypeListener);

    questionDiv.querySelector(".delete-question-button").addEventListener("click", () => {
        devQuestionsContainer.removeChild(questionDiv);
    });

    questionDiv.setAttribute("draggable",true);

    questionDiv.addEventListener("dragstart", (e) => {
        draggedItem = questionDiv;
        questionDiv.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
    });

    questionDiv.addEventListener("dragend", () => {
        draggedItem.classList.remove("dragging");
        draggedItem = null;
    });

}
devQuestionsContainer.addEventListener("dragover", (e) => {
    e.preventDefault(); 
    const afterElement = getDragAfterElement(devQuestionsContainer, e.clientY);
    if (afterElement == null) {
        devQuestionsContainer.appendChild(draggedItem);
    } else {
        devQuestionsContainer.insertBefore(draggedItem, afterElement);
    }
});
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".question-container:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function questionTypeListener(e) {
    const target = e.target;
    const quesDiv = target.closest(".question-container");

    let newQuestionTypeDiv;
    let rangeType;
    let isSelect = false;

    switch (target.value) {
        case "Text": newQuestionTypeDiv = document.createElement("textarea");
            newQuestionTypeDiv.classList.add("question-type-text");
            newQuestionTypeDiv.setAttribute("placeholder", "Type your answer here...");
            break;
        case "Number": newQuestionTypeDiv = document.createElement("input");
            newQuestionTypeDiv.setAttribute("type", "number");
            newQuestionTypeDiv.classList.add("question-type-number");
            newQuestionTypeDiv.setAttribute("placeholder", "Type your answer here...");
            rangeType="number";
            break;

        case "Date": newQuestionTypeDiv = document.createElement("input");
            newQuestionTypeDiv.setAttribute("type", "date");
            newQuestionTypeDiv.classList.add("question-type-date");
            rangeType="date";
            break;

        case "Document": newQuestionTypeDiv = document.createElement("input");
            newQuestionTypeDiv.setAttribute("type", "file");
            newQuestionTypeDiv.classList.add("question-type-document");
            break;
        case "dropdown-single":
        case "dropdown-multiple":
            isSelect = true;
            newQuestionTypeDiv = document.createElement("div");
            newQuestionTypeDiv.classList.add("question-type-select");
            let dropdownSelectDiv = document.createElement("select");
            dropdownSelectDiv.classList.add("dropdown-select-content");
            let addNewBtn = document.createElement("button");
            addNewBtn.classList.add("add-new-option-dropdown");
            addNewBtn.textContent = "Add new option";
            newQuestionTypeDiv.appendChild(addNewBtn);

            if (target.value === "Dropdown - Single select") {
                dropdownSelectDiv.multiple = false;
            } else {
                dropdownSelectDiv.multiple = true;
            }
    }

    const contentDiv = quesDiv.querySelector(".question-content");
    contentDiv.innerHTML = "";
    contentDiv.appendChild(newQuestionTypeDiv);
    
    isMaxLengthRequired(target,quesDiv);
    isRangeDivRequired(target,quesDiv,rangeType);

    if (isSelect) {
        addDropDownListener(newQuestionTypeDiv);
    }
    newQuestionTypeDiv.disabled = true;
}
function isMaxLengthRequired(target,quesDiv){
    let maxLenDiv=quesDiv.querySelector(".max-length-question");

    if (target.value === "Text") {
        maxLenDiv.textContent+="Max Length:";
        
        let newInputDiv=document.createElement("input");
        newInputDiv.setAttribute("type","number");

        maxLenDiv.appendChild(newInputDiv);
        addMaxLengthListener(quesDiv);
    } else {
        maxLenDiv.innerHTML="";
    }
}
function isRangeDivRequired(target,quesDiv,type){

    if (target.value === "Number" || target.value === "Date") {

            let startRange = document.createElement("input");
            startRange.classList.add("start-range");
            startRange.setAttribute("type", type);
            startRange.setAttribute("placeholder","Min");

            let endRange = document.createElement("input");
            endRange.classList.add("end-range");
            endRange.setAttribute("type",type);
            endRange.setAttribute("placeholder","Max");

        const rangeDiv = quesDiv.querySelector(".range-question");
        rangeDiv.innerHTML = "";
        rangeDiv.appendChild(startRange);
        rangeDiv.appendChild(document.createTextNode(" to "));
        rangeDiv.appendChild(endRange);
        addRangeValidateListener(quesDiv);
    } else {
        const rangeDiv = quesDiv.querySelector(".range-question");
        rangeDiv.innerHTML = "";
    }
}

function addRangeValidateListener(quesDiv) {
    const numberDiv = quesDiv.querySelector(".question-type-number");
    const dateDiv = quesDiv.querySelector(".question-type-date");
    const div = numberDiv || dateDiv;

    const startRangeDiv = quesDiv.querySelector(".start-range");
    const endRangeDiv = quesDiv.querySelector(".end-range");

    startRangeDiv.addEventListener("change", (e) => {
        let newStart = startRangeDiv.value;
        div.min = newStart;
    });
    endRangeDiv.addEventListener("change", (e) => {
        let newEnd = endRangeDiv.value;
        div.max = newEnd;
    });
}

function addMaxLengthListener(quesionDiv) {
    const textDiv = quesionDiv.querySelector(".question-type-text");
    const maxLenInput = quesionDiv.querySelector(".max-length-question input");
    maxLenInput.addEventListener("change", (e) => {
        let newLimit = parseInt(e.target.value);
        textDiv.setAttribute("maxlength",newLimit);
    });
}

function addDropDownListener(dropdownDiv, fromStorage=false, optionsList=[]) {
    let optionCount = 1;
    dropdownDiv.querySelector("button").addEventListener("click", (e)=>{createOption(dropdownDiv,"Option "+optionCount);optionCount+=1});
    if(!fromStorage){
        createOption(dropdownDiv,"Option "+optionCount);
        optionCount+=1;
        return ;
    }
    optionsList.forEach(option=>{
        createOption(dropdownDiv,option);
        optionCount+=1;
    });
}

function createOption(dropdownDiv,option="") {

    let newLiDiv = document.createElement("li");

    let newOption = document.createElement("input");
    newOption.setAttribute("type", "text");
    newOption.classList.add("dropdown-option");
    newOption.value=option;
    newOption.setAttribute("data-default-value",option);

     newOption.addEventListener("focus", function () {
            this.value = "";
    },{once:true});
    
    newLiDiv.appendChild(newOption);

    let deleteBtn = document.createElement("span");
    deleteBtn.innerHTML = "×";
    deleteBtn.classList.add("delete-option-btn");
    deleteBtn.addEventListener("click", (e) => {
        e.target.closest(".question-type-select").removeChild(e.target.closest("li"));
    });

    newLiDiv.appendChild(deleteBtn);
    dropdownDiv.appendChild(newLiDiv);
}
document.querySelector(".preview-form").addEventListener("click", () => {
    const questionsDivs=devQuestionsContainer.querySelectorAll(".question-text");
    for (let i = 0; i < questionsDivs.length; i++) {
        let questionDiv = questionsDivs[i];
        if (questionDiv.textContent === "") {
            questionDiv.focus();
            return; 
        }
        let contentDiv = questionDiv.nextElementSibling;
        if (contentDiv && contentDiv.querySelector(".question-type-select")) {
            let selectDiv = contentDiv.querySelector(".question-type-select");
            let listItems = selectDiv.querySelectorAll("li");

            for (let j = 0; j < listItems.length; j++) {
                let input = listItems[j].querySelector("input[type='text']");
                if (input && input.value.trim() === "") {
                    input.focus();
                    return; 
                }
            }
        }
    }
    saveQuestionsJSON();
    loadPreviewfromJSON();
});

function saveQuestionsJSON() {
    
    let currentState = {};
    let quesCount = 1;

    const questionsList = document.querySelectorAll(".question-container");

    questionsList.forEach(question => {
        const questionType = question.querySelector(".question-type-dropdown select")?.value;

        const questionObj = {
            questionType: questionType,
            userQuestion: question.querySelector(".question-text")?.textContent || '',
            questionEditableHTML: question.querySelector(".question-content")?.innerHTML || '',
            questionContent: getQuestionContent(question),
            isRequired: question.querySelector(".is-required")?.checked || false,
            isRangeRequired: (questionType === "Number" || questionType === "Date"),
            rangeObj: question.querySelector(".range-question")?.innerHTML || '',
            rangeMin:question.querySelector(".range-question .start-range")?.value||'',
            rangeMax:question.querySelector(".range-question .end-range")?.value||'',
            isMaxLengthReq: (questionType === "Text"),
            maxLength: question.querySelector(".max-length-question input")?.value || ''
        };
        //     // maxLength: question.querySelector(".max-length-question").innerHTML,
        // };
        currentState[quesCount] = questionObj;
        quesCount += 1;

    });
    localStorage.setItem("currentQuestions", JSON.stringify(currentState));

    console.log("Saved", currentState);
}
function createSelectFromOptions(options){
    const selectDiv = document.createElement("select");
    let newOp = document.createElement("option");
        newOp.value = "Select";
        newOp.textContent = "Select";
        selectDiv.appendChild(newOp);

    for(option in options) {
        let newOp = document.createElement("option");
        newOp.value = options[option];
        newOp.textContent = options[option];
        selectDiv.appendChild(newOp);
    }
    return selectDiv.outerHTML;
}
function createMultiSelectPreview(options){
    const selectDiv = document.createElement("div");
    
    options.forEach(option => {
        let newOp = document.createElement("input");
        newOp.setAttribute("type", "checkbox");
        newOp.value = option;
        newOp.classList.add("multi-select-option");
        
        let label = document.createElement("label");
        label.textContent = option;
        
        selectDiv.appendChild(newOp);
        selectDiv.appendChild(label);
        selectDiv.appendChild(document.createElement("br")); 
    });
    
    return selectDiv.outerHTML;
}

function loadPreviewfromJSON() {

    const questionsAnswersContainer = document.querySelector(".questions-preview-list");
    questionsAnswersContainer.innerHTML = "";
    const questionsPreviewList = JSON.parse(localStorage.getItem("currentQuestions"));


    for (questionCount in questionsPreviewList) {

        let question = questionsPreviewList[questionCount];
        let previewQuestion = document.createElement("div");
        previewQuestion.classList.add("question-preview-div");
        let ques = question.userQuestion;

        previewQuestion.appendChild(document.createTextNode(ques));

        let quesContent = document.createElement("div");
        quesContent.classList.add("question-content-preview-div");

       
        if(question.questionType=="dropdown-single"){
            quesContent.innerHTML=createSelectFromOptions(question.questionContent);
        }
        else if( question.questionType=="dropdown-multiple"){
            quesContent.innerHTML=createMultiSelectPreview(question.questionContent);
        }else{
            quesContent.innerHTML = question.questionEditableHTML;
        }
        quesContent.firstChild.disabled = false;

        let errorMsgDiv = document.createElement("p");
        errorMsgDiv.classList.add("error", "hidden");

        quesContent.appendChild(errorMsgDiv);
        quesContent.setAttribute("data-is-required", question.isRequired);
        previewQuestion.appendChild(quesContent);

        questionsAnswersContainer.appendChild(previewQuestion);
    }
}

function getQuestionContent(question){

    const content = question.querySelector(".question-content");

    const type = question.querySelector(".question-type-dropdown select").value;

    if (type === "dropdown-single" ||type === "dropdown-multiple" ) {
        const options = content.querySelectorAll(".dropdown-option");
        let optionsList=Array.from(options).map(option=>option.value);
        return optionsList;
    }
    return "";

}

function validateRequired(){

    const questionsAnswersContainer = document.querySelector(".questions-preview-list");
    const allQuestions = questionsAnswersContainer.querySelectorAll(".question-content-preview-div");
    const reqQuestions = Array.from(allQuestions).filter(quesion =>
        quesion.getAttribute("data-is-required") === "true"
    );

    var formValidated=true;

    reqQuestions.forEach(question => {
        const contentDiv = question.firstChild;
        let type = contentDiv.type;         // default type
        let valid = true;

        switch (type) {
            case "textarea":
                if (contentDiv.value.trim() === "") {
                    valid = false;
                }
                break;
            case "number":
                if (contentDiv.value === "") {
                    valid = false;
                }
                break;
            case "date":
                if (contentDiv.value === "") {
                    valid = false;
                }
                break;
            case "file":
                if (contentDiv.files.length === 0) {
                    valid = false;
                }
                break;
            case "select-one":
                if (contentDiv.value === "Select") {
                    valid = false;
                }
                break;
            default:
                const checkboxes = contentDiv.querySelectorAll(".multi-select-option");
                valid = Array.from(checkboxes).some(checkbox => checkbox.checked);
                break;
        }

        if (!valid) {
            let errorDiv = question.querySelector(".error");
            errorDiv.classList.remove("hidden");
            errorDiv.textContent = "This field is required";
            formValidated=false;
        } else {
            let errorDiv = question.querySelector(".error");
            errorDiv.classList.add("hidden");
        }
    });
    return formValidated;
}

function validateRanges(){

    const questionsAnswersContainer = document.querySelector(".questions-preview-list");
    const allQuestions = questionsAnswersContainer.querySelectorAll(".question-content-preview-div");
    const rangeDivs = Array.from(allQuestions).filter(quesion => (quesion.firstChild.type === "number" || quesion.firstChild.type === "date"));
    var formValidated=true;

    rangeDivs.forEach(div => {
        curRangeDiv = div.firstChild;
        let minValue, maxValue, curValue;
        if (curRangeDiv.type === "number") {
            minValue = parseInt(curRangeDiv.min);
            maxValue = parseInt(curRangeDiv.max);
            curValue = parseInt(curRangeDiv.value);
        } else {
            minValue = new Date(curRangeDiv.min);
            maxValue = new Date(curRangeDiv.max);
            curValue = new Date(curRangeDiv.value);
        }

        if(isNaN(curValue) || isNaN(minValue) || isNaN(maxValue)){
            // let errorDiv = div.querySelector(".error");
            // errorDiv.classList.add("hidden");
            return;  // continue
        }

            if (curValue < minValue || curValue > maxValue) {
                let errorDiv = div.querySelector(".error");
                errorDiv.classList.remove("hidden");
                errorDiv.textContent = "Select value within range :" + minValue + " and " + maxValue;
                formValidated=false;
            } else {
                let errorDiv = div.querySelector(".error");
                errorDiv.classList.add("hidden");
            }
    });
    return formValidated;
}

const validateSubmitBtn=document.querySelector(".validate-submit-questions");
validateSubmitBtn.addEventListener("click", (e) => {

    let reqRes=validateRequired();
    let rangeRes=validateRanges();

    if(reqRes && rangeRes ){
        // alert("Form submitted successfully");
        const allPreviewDivs=document.querySelectorAll(".question-content-preview-div");
        Array.from(allPreviewDivs).forEach(div=>{
            div.firstChild.disabled=true;
        });
        validateSubmitBtn.textContent="Submitted";
        validateSubmitBtn.disabled=true;
    }
});







