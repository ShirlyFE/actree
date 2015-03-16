var doc = document.body.getElementsByTagName('*'),
    docLen = doc.length,
    timer = null,
    vmtree = [],
    avalonInUse = false

timer = setTimeout(sendMessage, 1000)
function sendMessage() {
    var currentDocLen = doc.length
    clearTimeout(timer)
    timer = null
    if (docLen === currentDocLen) {
        /* 
            在content script中只可以操作页面dom但是无法访问页面的js,像下面这样访问页面avalon是不可能的
            avalonInUse = window.avalon && window.avalon.version && window.avalon.bindingHandlers ? true : false
        */
        anaysisVmodel(document.body, vmtree)
        vmtree = {name: "Root", children: vmtree}
        /* 
            message最终会转换为json串，在这里给vmtree设置toggle方法毫无意义，所以将vmtree的信息完善工作放在popup js里去做
            本来是要根据用户的窗口大小来决定popup的窗口大小的，但是发现chrome给popup设定了width最大800和height最大600的限制，超过大小会显示滚动条，因此就直接显式的设置了popup的width和height
        */
        chrome.runtime.sendMessage({tree: vmtree, avalon: avalonInUse})
    } else {
        docLen = doc.length
        timer = setTimeout(sendMessage, 1000)
    }
}
/*
 * description: 遍历页面元素获取页面vmodel的嵌套关系
 */
function anaysisVmodel(parent, vmtree) {
    var vmodel = parent.getAttribute('avalonctrl'),
        subVm = vmtree
    if (vmodel) {
        if (!avalonInUse) {
            avalonInUse = true
        }
        subVm = {name: vmodel, children: []}
        vmtree.push(subVm)
    }
    var childNodes = parent.children,
        childNodesLen = childNodes.length

    if (childNodesLen) {
        for (var i = 0; i < childNodesLen; i++) {
            anaysisVmodel(childNodes[i], subVm.children || subVm)
        }
    }
}
/*
vmtree结构类似于：
vmtree = {
    name: 'Root',
    children: [{
        name: 'vm1',
        children: []
    }, {
        name: 'vm2',
        children: [{
            name: 'vm2_1',
            children: []
        }, {
            name: 'vm2_2',
            children: []
        }]
    }]
}

*/