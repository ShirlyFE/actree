var pageData = null
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest){
    pageData = request
    if (pageData.avalon) {
        chrome.pageAction.show(sender.tab.id)
    }
});
