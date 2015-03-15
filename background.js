var pageData = null
// https://developer.chrome.com/extensions/messaging
// https://developer.chrome.com/extensions/tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest){
    pageData = request
    if (pageData.avalon) {
        chrome.pageAction.show(sender.tab.id)
    }
});
