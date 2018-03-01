//Version 2: I want the customer to receive an email with their responses in it.
//Shawn Hodgson
//11/08/2015
// menu added on open
function onOpen() {
FormApp.getUi() // Or DocumentApp or FormApp.
.createMenu('Settings')
.addItem('Authorize', 'authorize')
.addItem('Set Email', 'setEmailInfo')
.addToUi();
}

//easily authorize the script to run from the menu
function authorize(){
var respEmail = Session.getActiveUser().getEmail();
MailApp.sendEmail(respEmail,"Form Authorizer", "Your form has now been authorized to send you emails");
}

//Set email, subject, and message body for form submission
function setEmailInfo(){

var ui = FormApp.getUi();
var app = UiApp.createApplication().setWidth("500").setHeight("500");
var panel = app.createVerticalPanel();
var ccLB = app.createLabel("email addresses for CC: Example add1@mail.com,add2@mail.com");
var ccTB = app.createTextBox().setId('ccTB').setName('ccTB').setWidth("500");
var subLB = app.createLabel("Please enter subject.");
var subTB = app.createTextBox().setId('subTB').setName('subTB').setWidth("500");
var msgLB = app.createLabel("Please enter message.");
var msgTA = app.createTextBox().setId('msgTA').setName('msgTA').setWidth("500").setHeight("150");
var submit = app.createButton('Submit');

panel.add(ccLB).add(ccTB).add(subLB).add(subTB).add(msgLB).add(msgTA).add(submit);
app.add(panel);

var handler = app.createServerHandler('updateEmail');
handler.addCallbackElement(panel);
submit.addClickHandler(handler);
ui.showModalDialog(app, 'Email Settings');
}

//click handler for setEmailInfo that saves values into script properties
function updateEmail(e){

var app = UiApp.getActiveApplication();
var sub = e.parameter.subTB;
var msg = e.parameter.msgTA;
var cc = e.parameter.ccTB;
setProperty('EMAIL_SUBJECT',sub);
setProperty('EMAIL_MESSAGE',msg);
setProperty('CC_ADDRESS',cc);
app.close();
return app;
}

//setting script properties
function setProperty(key,property){

var scriptProperties = PropertiesService.getScriptProperties();
scriptProperties.deleteProperty(key);
scriptProperties.setProperty(key,property);

}

//getting script properties
function getProperty(property){
var scriptProperties = PropertiesService.getScriptProperties();
var savedProp = scriptProperties.getProperty(property);

if (!savedProp){
savedProp = "";
}
return  savedProp;
}

//get user email/utility function
function getUserEmail(response){
Logger.log(1);
var itemRes = response.getItemResponses();
for (var i = 0; i < itemRes.length; i++){
var respQuestion = itemRes[i].getItem().getTitle();
var index = itemRes[i].getItem().getIndex();
var email = respQuestion.toLowerCase();
var regex = /.*email.*/;
if(regex.test(email) == true){
email = itemRes[i].getResponse();
return email;

}
}
}

//function to put it all together
function controller(e){

var response = e.response;
var  userEmail = getUserEmail(response);
var emailSubject = getProperty('EMAIL_SUBJECT');
var message = getProperty('EMAIL_MESSAGE');
var cc =   getProperty('CC_ADDRESS');
var secHeader = true;
var includeEmpty = false;
var body;
//get questions and responses

var resp = getResponse(response,secHeader,includeEmpty);
//format with html
var msgBodyTable = formatHTML(resp);
//email
body = message +  msgBodyTable;
sendEmail(userEmail,emailSubject,body,cc);

}

//function to send out mail
function sendEmail(emailRecipient,emailSubject,body,ccRecipient){

MailApp.sendEmail(emailRecipient,emailSubject,"", {htmlBody: body, cc: ccRecipient});

}

//Function get form items and form responses. Builds and and returns an array of quesions: answer.
function getResponse(response,secHeader,includeEmpty){
var form = FormApp.getActiveForm();
var items = form.getItems();
var response = response;
var itemRes = response.getItemResponses();
var array = [];
for (var i = 0; i < items.length; i++){
var question = items[i].getTitle();
var answer = "";

//include section headers and description in email only runs when user sets setHeader to true
if (items[i].getType() == "SECTION_HEADER" && secHeader == true){
var description = items[i].getHelpText();
var title = items[i].getTitle();
var regex = /^s*(?:[dA-Z]+.|[a-z])|•)s+/gm;
description = description.replace(regex,"<br>");

array.push("<strong>" + title + "</strong><br>" + description);
continue;
}

//loop through to see if the form question title and the response question title matches. If so push to array, if not answer is left as ""
for (var j = 0; j < itemRes.length; j++){
var respQuestion = itemRes[j].getItem().getTitle();
//itemRes[j].getResponse()
if (question == respQuestion){

if(items[i].getType() == "CHECKBOX"){

var answer =  formatCheckBox(itemRes[j].getResponse());
break;
}
else{
var answer = itemRes[j].getResponse();
break;
}
}
}
//run this block of code if no empty responses are included
if(includeEmpty == false){
if(answer != ""){
array.push("<strong>" + question + "</strong>" + ": " + answer);
}
}
//run this block of clode if emty responses are included
else{
array.push("<strong>" + question + "</strong>" + ": " + answer);
}
}

return array;
}

function formatCheckBox(chkBoxArray){

for (var i = 0; i < chkBoxArray.length; i++){
chkBoxArray[i] = "<br>" + chkBoxArray[i];
}

return chkBoxArray.join(" ");

}
//formats an array as a table
function formatHTML(array){

var tableStart = "<br><br><html><body><table border="1">";
var tableEnd = "</table></body></html>";
var rowStart = "<tr>";
var rowEnd = "</tr>";
var cellStart = "<td>";
var cellEnd = "</td>";
for (i in array){
array[i] = rowStart + cellStart + array[i] + cellEnd + rowEnd;
}

array  = array.join('');
array = tableStart + array + tableEnd;
return array;
}