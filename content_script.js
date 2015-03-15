var doc = document.body.getElementsByTagName('*'),
    docLen = doc.length,
    timer = null,
    // vmtree = {},
    vmtree = []
    // str = '<ul>'


timer = setTimeout(sendMessage, 1000)

function sendMessage() {
    var currentDocLen = doc.length,
        treeStr = '',
        width = document.documentElement.clientWidth,
        height = document.documentElement.clientHeight
        
    clearTimeout(timer)
    timer = null
    if (docLen === currentDocLen) {
        anaysisVmodel(document.body, vmtree)
        vmtree = {name: "Root", children: vmtree}
        // updateVmtree(vmtree)
        // treeStr = createTree(vmtree)
        // message最终会转换为json串，在这里给vmtree设置toggle方法毫无意义，所以讲vmtree的信息完善工作放在popup js里去做
        chrome.runtime.sendMessage({tree: vmtree})
        // chrome.runtime.sendMessage({tree: vmtree, height: height, width: width})
    } else {
        docLen = doc.length
        timer = setTimeout(sendMessage, 1000)
    }
}

function anaysisVmodel(parent, vmtree) {
    var vmodel = parent.getAttribute('avalonctrl'),
        subVm = vmtree
    if (vmodel) {
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

// function updateVmtree(data) {
//     if (data.children.length) {
//         data.expanded = true
//         data.toggle = function() {
//             this.expanded = !this.expanded
//         }
//         data.children.forEach(function(item, index) {
//             updateVmtree(item)
//         })
//     } else {
//         delete data.children
//     }
// }

// function createTree(tree, treeName) {
//     var propertyLen = 0,
//         str = '',
//     treeName = treeName ? treeName : ''
//     str = treeName + '<ul>'
//     for (var i in tree) {
//         if (tree.hasOwnProperty(i)) {
//             propertyLen++;
//             str+='<li>' + createTree(tree[i], i) + '</li>'
//         }
//     }
//     str += '</ul>'
//     if (!propertyLen) return treeName
//     return str
// }