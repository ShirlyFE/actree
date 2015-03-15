var pageData = null
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest){
    pageData = request
    console.log('background pageData : ')
    console.log(pageData)
});
