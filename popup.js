// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
(function() {
    var window = this
    function Tree(config) {
        util.extends(this, config)
        this.diagonal = d3.svg.diagonal().projection(function(d) {
            return [d.y, d.x]
        })
        /*
            children方法用来get or set the children accessor function
        */
        this.w = d3.layout.tree().children(config.setChildren).size([this.height, this.width])
        H = H.bind(this)
        /*
            on用来绑定当scale和translate change时的listeners
        */ 
        this.m = d3.behavior.zoom().scaleExtent([.1, 3]).on('zoom', H).translate([this.g, this.height/2]).scale(1)

        this.svg = d3.select(this.container).append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'overlay')
            .call(this.m)
            .on('dblclick.zoom', null)
            .on('mousewheel.zoom', null)
        this.y = this.svg.append('g')
        this.treePaint()
        this.controlDirection()
    }
    Tree.prototype.treePaint = treePaint
    Tree.prototype.pan = function(e) {
        var m = this.m,
            t = m.translate(),
            u = this.u,
            g = this.g,
            w = this.w
        if (typeof e === 'string') {
            switch(e) {
                case "down":
                    t[1] -= u
                    break;
                case "up":
                    t[1] += u
                    break;
                case "right":
                    t[0] -= u
                    break;
                case "left":
                    t[0] += u
                    break;
                case "center":
                    t = [g, this.height / 2 - w.size()[0] / 2]
                    break
            } 
        } else {
            t[0] += e[0]
            t[1] += e[1]
        }
        m.translate(t)
        H(true)
    }
    Tree.prototype.transformScale = function(e) {
        var m = this.m,
            t = m.scale()
        switch(e) {
            case "zoom-in":
                t += .1
                break
            case "zoom-out":
                t -= .1
                break
        }
        m.scale(t)
        H(true)
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
    };
    function nodePaint(f, e) {
        var that = this,
            k = this.k,
            g = this.g,
            b
        function A(e, t) {
            if (!k["Root"])
                return k["Root"] = {x: that.radius,y: g};
            if (!e)
                return console.log("Specify item to init coords");
            if (!t)
                t = e.parent;
            if (!k[e.name] && e.origin) {
                return k[e.name] = k[e.origin]
            }
            if (k[t.name]) {
                k[e.name] = {x: k[t.name].x,y: k[t.name].y}
            } else if (t.type != "Root")
                A(e, t.parent);
            return k[e.name]
        }
        function p(e) {
            var t = null;
            d3.selectAll("path.link").each(function(i) {
                if (i.target.name == e.name) {
                    t = {data: i,pathSvg: d3.select(this)}
                }
            });
            return t
        } 
        function T(e) {
            d3.event.stopPropagation();
            if (!e._children || !e._children.length) return
            e.toggle();
            that.treePaint(e);
            that.pan([0, that.k[e.name].x - e.x])
        }
        function P (e) {
            if (!e.children) return 10
            return -30
        }
        function z(e) {
            if (!e.children) return 'start'
            return 'end'
        }
        h = f.enter().append('g').attr('id', function(e){
            return e.name
        }).attr('class', 'node').attr("transform", function(e) {
            var t = A(e);
            return "translate(" + t.y + "," + t.x + ")"
        })
        h.on('mouseover', function(e) {
            var t = e;
            d3.select(this).select('circle').classed('active', true)
            while (true) {
                var i = p(t);
                if (!i)
                    break;
                i.pathSvg.classed("active", true);
                t = i.data.source
            }
        }).on('mouseout', function() {
            d3.selectAll('path.link.active').classed('active', false)
            d3.select(this).select('circle').classed('active', false)
        }).on('click', T)
        h.append('circle').attr('class', 'circle').attr('r', this.radius)
        h.append("text").attr("x", P).attr("dy", ".35em").attr("dx", ".70em").attr("class", "nodeText").attr("text-anchor", z).text(function(e) {
                return e.name
            })
        f.transition().duration(this.a).attr('transform', function(e) {
            that.k[e.name] = {x:e.x, y: e.y}
            return "translate(" + e.y + "," + e.x + ")"
        })
        f.classed('collapsed', function(e) {
            return e.expanded == false
        })
        b = f.exit().transition().duration(that.a).attr("transform", function(t) {
                if (t.parent && util.contains(t.parent.children, t)) {
                    return "translate(" + e.y + "," + e.x + ")"
                } else {
                    return "translate(" + t.y + "," + t.x + ")"
                }
            }).remove();
        b.select("circle").attr("r", 0);
        b.select("text").style("fill-opacity", 0);
    }
    function pathPaint (y, f, u, e) {
        var that = this,
            w = that.w,
            C = w.links(u),
            D = y.selectAll('path.link').data(C, function(e) {
                return e.target.name
            })

        D.enter().insert('path', 'g').attr('class', 'link')
        .attr('d', function(t) {
            e = e ? e : that.k["Root"]
            var i = {x: e.x,y: e.y};
            return that.diagonal({source: i,target: i})
        })
        D.transition().duration(that.a).attr("d", that.diagonal);
        D.exit().transition().duration(that.a).attr("d", S).remove();
        function S(t) {
            e = e ? e : k['Root']
            if (util.contains(t.source._children, t.target)) {
                var i = {x: e.x,y: e.y};
                return that.diagonal({source: i,target: i})
            } else {
                return that.diagonal({source: {x: t.source.x,y: t.source.y},target: {x: t.target.x,y: t.target.y}})
            }
        }
    }
    function treePaint(e) {
        var that = this,
            y = that.y,
            n = getMaxDeep([1], that.data),
            s = n * that.l,
            w = that.w.size([s, that.width]),
            u = w.nodes(that.data),
            f = y.selectAll('g.node').data(u, function(e){
                return e.name
            }),
            Root = e ? false : true
        e = e ? e : that.k['Root']
        that.w = w
        u.forEach(function(e) {
            e.y = e.depth * that.o
        })
        nodePaint.bind(that)(f, e)
        pathPaint.bind(that)(y, f, u, e)
        if (Root) {
            that.pan('center')
        }
    }
    function getMaxDeep(n, data) {
        function getDeep(e, t) {
            var i = t.children;
            if (i && i.length > 0) {
                if (n.length <= e + 1)
                    n.push(0);
                n[e + 1] += i.length;
                i.forEach(function(t) {
                    getDeep(e + 1, t)
                })
            }
        }
        getDeep(0, data)
        return d3.max(n)
    }
    function H(e) {
        var i = "translate(" + this.m.translate() + ")scale(" + this.m.scale() + ")";
        if (e) {
            this.y.transition().duration(this.a).attr("transform", i)
        } else {
            this.y.attr("transform", i)
        }
    }
    window.Tree = Tree
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
        // width = data.width,
        // height = data.height,
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
        g: 80,
        l: 60,
        s: 0,
        o: 250,
        k: {},
        a: 750,
        u: 200,
        directionContainer: 'directionContainer',
        zoomClass: 'transformScale',
        navigationClass: 'navigationControl',
        container: '#tree',
        setChildren: function(e) {
            if (e.children && !e._children) {
                e._children = e.children
            }
            if (!e.children && e._children) {
                e.children = e._children
            }
            return e.expanded && e.children
        }
    }
    var tree = new Tree(config)
    function updateVmtree(data) {
        if (data.children.length) {
            data.expanded = true
            data.toggle = function() {
                this.expanded = !this.expanded
            }
            data.children.forEach(function(item, index) {
                updateVmtree(item)
            })
        } else {
            delete data.children
        }
        return data
    }
});