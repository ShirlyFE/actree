// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
(function(global) {
    function Tree(config) {
        util.extends(this, config)
        this.nodesInfo = {}
        this.diagonal = d3.svg.diagonal().projection(function(d) {
            return [d.y, d.x]
        })
        /*
            children方法用来get or set the children accessor function
        */
        this.tree = d3.layout.tree().children(config.setChildren).size([this.height, this.width])
        zoomCallback = zoomCallback.bind(this)
        /*
            on用来绑定当scale和translate change时的listeners
        */ 
        this.zoomBehavior = d3.behavior.zoom().scaleExtent([.1, 3]).on('zoom', zoomCallback).translate([this.g, this.height/2]).scale(1)

        this.svg = d3.select(this.container).append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'overlay')
            .call(this.zoomBehavior)
            .on('dblclick.zoom', null)
            .on('mousewheel.zoom', null)
        this.gElem = this.svg.append('g')
        this.treePaint()
        this.controlDirection()
    }
    Tree.prototype.treePaint = treePaint
    Tree.prototype.pan = function(direction) {
        var zoomBehavior = this.zoomBehavior,
            zoomTranslate = zoomBehavior.translate(),
            translateDistance = this.translateDistance, //变换距离
            centerX = this.centerX,
            tree = this.tree
        if (typeof direction === 'string') {
            switch(direction) {
                case "down":
                    zoomTranslate[1] -= translateDistance
                    break;
                case "up":
                    zoomTranslate[1] += translateDistance
                    break;
                case "right":
                    zoomTranslate[0] -= translateDistance
                    break;
                case "left":
                    zoomTranslate[0] += translateDistance
                    break;
                case "center":
                    zoomTranslate = [centerX, this.height / 2 - tree.size()[0] / 2]
                    break
            } 
        } else {
            zoomTranslate[0] += direction[0]
            zoomTranslate[1] += direction[1]
        }
        zoomBehavior.translate(zoomTranslate)
        zoomCallback(true)
    }
    Tree.prototype.transformScale = function(zoomCase) {
        var zoomBehavior = this.zoomBehavior,
            scaleVar = zoomBehavior.scale()
        switch(zoomCase) {
            case "zoom-in":
                scaleVar += .1
                break
            case "zoom-out":
                scaleVar -= .1
                break
        }
        zoomBehavior.scale(scaleVar)
        zoomCallback(true)
    }
    Tree.prototype.controlDirection = function() {
        var that = this,
            navigation = this.navigationClass,
            zoom = this.zoomClass,
            directionContainer = this.directionContainer
        
        document.getElementById(directionContainer).addEventListener('click', function(e) {
            e.preventDefault()
            e.stopPropagation()
            var target = e.target
            do {
                if (target == this) break
                if (target.tagName.toLowerCase() === 'td') {
                    if (target.className.indexOf(navigation) != -1) {
                        that.pan(target.getAttribute('data-direction'))
                        break
                    }
                    if (target.className.indexOf(zoom) != -1) {
                        that.transformScale(target.getAttribute('data-direction'))
                        break
                    }
                } else {
                    target = target.parentNode
                }
            } while(true)
        })
    }
    function nodePaint(gNodes, node) {
        var that = this,
            nodesInfo = this.nodesInfo,
            centerX = this.centerX,
            gRemoveNodes,
            gCollection 
        // init node coords and save it to nodesInfo object
        function setNodesInfo(nodeData, parentNode) {
            if (!nodesInfo["Root"])
                return nodesInfo["Root"] = {x: that.radius,y: centerX};
            if (!nodeData)
                return console.log("Specify item to init coords");
            if (!parentNode)
                parentNode = nodeData.parent;
            if (!nodesInfo[nodeData.name] && nodeData.origin) {
                return nodesInfo[nodeData.name] = nodesInfo[nodeData.origin]
            }
            if (nodesInfo[parentNode.name]) {
                nodesInfo[nodeData.name] = {x: nodesInfo[parentNode.name].x,y: nodesInfo[parentNode.name].y}
            } else if (parentNode.type != "Root")
                setNodesInfo(nodeData, parentNode.parent);
            return nodesInfo[nodeData.name]
        }
        function getPath(nodeData) {
            var pathInfo = null;
            d3.selectAll("path.link").each(function(pathNode) {
                if (pathNode.target.name == nodeData.name) {
                    pathInfo = {data: pathNode, pathSvg: d3.select(this)}
                }
            });
            return pathInfo
        } 
        function subTreeHandle(nodeData) {
            d3.event.stopPropagation();
            if (!nodeData._children || !nodeData._children.length) return
            nodeData.toggle();
            that.treePaint(nodeData);
            that.pan([0, that.nodesInfo[nodeData.name].x - nodeData.x])
        }
        function positionTextNode (nodeData) {
            if (!nodeData.children) return 10
            return -30
        }
        function setNodeType(nodeData) {
            if (!nodeData.children) return 'start'
            return 'end'
        }
        gCollection = gNodes.enter().append('g').attr('id', function(nodeData){
            return nodeData.name
        }).attr('class', 'node').attr("transform", function(nodeData) {
            var nodeInfo = setNodesInfo(nodeData);
            return "translate(" + nodeInfo.y + "," + nodeInfo.x + ")"
        })
        gCollection.on('mouseover', function(nodeData) {
            var source = nodeData
            d3.select(this).select('circle').classed('active', true)
            while (true) {
                var pathInfo = getPath(source);
                if (!pathInfo)
                    break;
                pathInfo.pathSvg.classed("active", true);
                source = pathInfo.data.source
            }
        }).on('mouseout', function() {
            d3.selectAll('path.link.active').classed('active', false)
            d3.select(this).select('circle').classed('active', false)
        }).on('click', subTreeHandle)
        gCollection.append('circle').attr('class', 'circle').attr('r', this.radius)
        gCollection.append("text").attr("x", positionTextNode).attr("dy", ".35em").attr("dx", ".70em").attr("class", "nodeText").attr("text-anchor", setNodeType).text(function(nodeData) {
                return nodeData.name
            })
        gNodes.transition().duration(this.animateTime).attr('transform', function(nodeData) {
            that.nodesInfo[nodeData.name] = {x:nodeData.x, y: nodeData.y}
            return "translate(" + nodeData.y + "," + nodeData.x + ")"
        })
        gNodes.classed('collapsed', function(nodeData) {
            return nodeData.expanded == false
        })
        gRemoveNodes = gNodes.exit().transition().duration(that.animateTime).attr("transform", function(nodeData) {
                if (nodeData.parent && util.contains(nodeData.parent.children, nodeData)) {
                    return "translate(" + node.y + "," + node.x + ")"
                } else {
                    return "translate(" + nodeData.y + "," + nodeData.x + ")"
                }
            }).remove();
        gRemoveNodes.select("circle").attr("r", 0);
        gRemoveNodes.select("text").style("fill-opacity", 0);
    }
    function pathPaint (gElem, gNodes, initDataInfo, node) {
        var that = this,
            tree = that.tree,
            pathNodes = tree.links(initDataInfo),
            pathCollection = gElem.selectAll('path.link').data(pathNodes, function(nodeData) {
                return nodeData.target.name
            })

        pathCollection.enter().insert('path', 'g').attr('class', 'link')
        .attr('d', function() {
            node = node ? node : that.nodesInfo["Root"]
            var coords = {x: node.x,y: node.y};
            return that.diagonal({source: coords,target: coords})
        })
        pathCollection.transition().duration(that.animateTime).attr("d", that.diagonal);
        pathCollection.exit().transition().duration(that.animateTime).attr("d", setDAttr).remove();
        function setDAttr(nodeData) {
            node = node ? node : nodesInfo['Root']
            if (util.contains(nodeData.source._children, nodeData.target)) {
                var coords = {x: node.x,y: node.y};
                return that.diagonal({source: coords,target: coords})
            } else {
                return that.diagonal({source: {x: nodeData.source.x,y: nodeData.source.y},target: {x: nodeData.target.x,y: nodeData.target.y}})
            }
        }
    }
    function treePaint(node) {
        var that = this,
            gElem = that.gElem,
            maxDeep = getMaxDeep([1], that.data),
            treeHeight = maxDeep * that.pathHeight,
            tree = that.tree.size([treeHeight, that.width]),
            initDataInfo = tree.nodes(that.data),
            gNodes = gElem.selectAll('g.node').data(initDataInfo, function(nodeData){
                return nodeData.name
            }),
            Root = node ? false : true
        node = node ? node : that.nodesInfo['Root']
        that.tree = tree
        initDataInfo.forEach(function(nodeData) {
            nodeData.y = nodeData.depth * that.nestInterval
        })
        nodePaint.bind(that)(gNodes, node)
        pathPaint.bind(that)(gElem, gNodes, initDataInfo, node)
        if (Root) {
            that.pan('center')
        }
    }
    function getMaxDeep(deepArr, data) {
        function getDeep(deep, data) {
            var children = data.children;
            if (children && children.length > 0) {
                if (deepArr.length <= deep + 1)
                    deepArr.push(0);
                deepArr[deep + 1] += children.length;
                children.forEach(function(data) {
                    getDeep(deep + 1, data)
                })
            }
        }
        getDeep(0, data)
        return d3.max(deepArr)
    }
    function zoomCallback(selfFire) {
        var translateStr = "translate(" + this.zoomBehavior.translate() + ")scale(" + this.zoomBehavior.scale() + ")";
        if (selfFire) {
            this.gElem.transition().duration(this.animateTime).attr("transform", translateStr)
        } else {
            this.gElem.attr("transform", translateStr)
        }
    }
    global.Tree = Tree
})(this)
var util = {
    extends: function(source, target) {
        for(var i in target) {
            if (target.hasOwnProperty(i)) {
                source[i] = target[i]
            }
        }
    },
    contains: function(obj, target) {
        if (!obj) return false
        var i = 0, length = obj.length;

        for (; i < length; i++) if (obj[i] === target) return true;
        return false;
    }
}
/*
Chrome extension popups have a maximum height of 600px and maximum width of 800px. Changing the width or height using CSS on the html or body element will just cause scroll bars (as you have noticed) when over these maximums. Using something like window.resizeBy(x,y) will have no effect.
http://stackoverflow.com/questions/8983165/how-can-i-expand-the-popup-window-of-my-chrome-extension

*/ 
    
document.addEventListener('DOMContentLoaded', function() {
    var data = chrome.extension.getBackgroundPage().pageData,
        width = 750,
        height = 550,
        treeContainer = document.getElementById('tree')
    treeContainer.style.cssText = 'width:'+width+'px;height:'+height+'px;' 
    if (!data) {
        treeContainer.innerHTML = '数据正在解析中，请稍等片刻重试...'
    }
    
    var config = {
        data: updateVmtree(data.tree),
        width: width,
        height: height,
        radius: 10,
        centerX: 80,
        pathHeight: 50,
        nestInterval: 250,
        animateTime: 750,
        translateDistance: 200,
        directionContainer: 'directionContainer',
        zoomClass: 'transformScale',
        navigationClass: 'navigationControl',
        container: '#tree',
        setChildren: function(nodeData) {
            if (nodeData.children && !nodeData._children) {
                nodeData._children = nodeData.children
            }
            if (!nodeData.children && nodeData._children) {
                nodeData.children = nodeData._children
            }
            return nodeData.expanded && nodeData.children
        }
    }
    var tree = new Tree(config)
    function updateVmtree(data) {
        var children = data.children
        if (children && children.length) {
            data.expanded = true
            data.toggle = function() {
                this.expanded = !this.expanded
            }
            children.forEach(function(item, index) {
                updateVmtree(item)
            })
        } else {
            delete children
        }
        return data
    }
});