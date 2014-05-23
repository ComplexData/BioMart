;(function (angular, d3) {
"use strict";

//
// https://github.com/densitydesign/raw/blob/41192997a407f79f4891523ead152f880007cc63/js/directives.js#L526
//

var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

function downloadSvg(container){
  container = d3.select(container);
  var BB = window.Blob || window.WebKitBlob || window.MozBlob;

  var html = container.select("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().parentNode.innerHTML;

  if (isSafari) {
    var img = "data:image/svg+xml;utf8," + html;
    window.open(img, "_blank");
  } else {
    var blob = new BB([html], { type: "data:image/svg+xml" });
    saveAs(blob, "enrichment-network.svg");
  }
}

function downloadJson (graph) {
  var json = JSON.stringify(graph);
  if (isSafari) {
    var jsonDownloadable = "data:application/json;utf8," + json;
    window.open(jsonDownloadable, "_blank");
  } else {
    var blob = new Blob([json], { type: "data:application/json;charset=utf-8" });
    saveAs(blob, "enrichment-network.json")
  }
}

function downloadTsv (graph) {
  var terms = {};
  for (var i = 0, ii = graph.edges.length; i < ii; ++i) {
    var e = graph.edges[i];
    (terms[e.target.id] || (terms[e.target.id] = [])).push(e.source.id);
  }

  var tsv = "", sep = "\t";
  for (var termId in terms) {
    var termList = graph.nodes.filter(function findTermById(n) {
        return n.id === termId;
      }),
      term = termList[0];
    tsv += [
      termId,
      term.description,
      terms[termId].join(","),
      term.pvalue
    ].join(sep) + "\n";
  }

  if (isSafari) {
    var tsvDownloadable = "data:application/json;utf8," + tsv;
    window.open(tsvDownloadable, "_blank");
  } else {
    var blob = new Blob([tsv], { type: "data:text/plain;charset=utf-8" });
    saveAs(blob, "enrichment-network.tsv");
  }
}

function downloadPng(container){
  container = d3.select(container);
  var content = d3.select("body").append("canvas")
      .attr("id", "canvas")
      .style("display","none")

  var html = container.select("svg")
      .node().parentNode.innerHTML;

  canvg('canvas', html);
  var canvas = document.getElementById("canvas");

  var isSafari = (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);

  if (isSafari) {
    var img = canvas.toDataURL("image/png;base64");
    var newWindow = window.open(img, 'download');
  } else {
    canvas.toBlob(function (blob) {
      saveAs(blob, "enrichment-network.png");
    }, "image/png");
  }

  d3.select("#canvas").remove();
}


var graph = (function (d3) {

  "use strict";

  return function graph (nodes, edges, options) {
    options = options || {};
    var container = d3.select(options.container);
    var nthTerms = options.showNth || 5;
    var margin = options.margin || { top: 20, right: 30, bottom: 20, left: 30 };
    var width = (options.width || 1200) - margin.right - margin.left;
    var height = (options.height || 800) - margin.top - margin.bottom;
    // Replace ids with reference to node object
    putSourceTargetRef(nodes, edges);

    // Terms are sorted per pvalue in increasing order.
    // Take the first n.
    var terms = nodes.filter(onlyTerm).splice(0, nthTerms);
    var pvalueExtent = d3.extent(terms, getPvalue);
    // Genes connected to these terms.
    var coll = connections(terms, edges);
    var genes = coll[0];
    edges = coll[1];
    var geneTipProps = Object.keys(genes[0]);
    var termTipProps = Object.keys(terms[0]).filter(function (k) {
      return k[0] !== "$" && k[0] !== "_";
    });
    coll = null;

    // zoom: mousewheel
    // pan: right button click
    // drag of nodes: click
    // selection: click

    var zoom = d3.behavior.zoom()
        .scaleExtent([0, 4])
        .on("zoom", zooming);

    var svg = container.append("svg:svg")
        .attr({
          "title": "test2",
          "version": 1.1,
          "xmlns": "http://www.w3.org/2000/svg",
          width: width + margin.right + margin.left,
          height: height + margin.top + margin.bottom
        })
        .style("cursor", "pointer")
      .append("svg:g")
        .attr("transform", ["translate(", margin.left, ",", margin.top, ")"].join(''))
        .call(zoom)
        // remove pan
        .on("mousedown.zoom", null);

    // var canvasImage = svg.append("svg:text")
    //   .attr({
    //     x: width - 30, y: margin.top + 30
    //   })
    //   .style("cursor", "pointer")
    //   .text("Get Image")
    //   .on("click", createImage);

    var rect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        var props = d.type === "gene" ? geneTipProps : termTipProps;
        return props.reduce(function (s, p) {
            return s + '<strong class="d3-tip-prop">'+p+"</strong>: "+d[p] + "<br/>";
          }, "");
      });

    var vis = svg.append("svg:g")
        .attr({
          "class": "enrichment-vis",
          transform: ["translate(", margin.left, ",", margin.top, ")"].join('')
        });

    // var brush = vis.append("g")
    //     .attr("class", "brush")
    //     .call(d3.svg.brush()
    //       .x(d3.scale.identity().domain([0, width]))
    //       .y(d3.scale.identity().domain([0, height]))
    //       .on("brush", function() {
    //         function nodeSelected (d) {
    //           return d.selected = (extent[0][0] <= d.x && d.x < extent[1][0] && extent[0][1] <= d.y && d.y < extent[1][1]);
    //         }
    //         var extent = d3.event.target.extent();
    //         geneNodes.classed("node-selected", nodeSelected);
    //         termNodes.classed("node-selected", nodeSelected);
    //       })
    //       .on("brushend", function() {
    //         d3.event.target.clear();
    //         d3.select(this).call(d3.event.target);
    //       }));

    var linkDistance = termRadius({pvalue: pvalueExtent[0]}) * 3.5;
    placeAlongCircle(terms, { centre: [width/2, height/2], radius: 5, offset: 5 });
    placeAlongCircle(genes, { centre: [width/2, height/2], radius: linkDistance, offset: 5 });
    var force = d3.layout.force()
      .size([width, height])
      .linkDistance(linkDistance)
      .nodes(terms.concat(genes))
      .links(edges)
      .gravity(0.4)
      .charge(function (node, idx) {
        return node.type === "gene" ? -400 : -100 * node.weight;
      })
      .on("tick", fociTick)
      .on("end", fixEles)
      .start()
      .alpha(0.02);

    var drag = force.drag()
      .on("dragstart", dragstarted)
      // .on("drag", dragging)
      .on("dragend", dragended);

    nodes = force.nodes();

    var links = vis.selectAll(".line")
      .data(edges)
    .enter().append("line")
      .attr("class", "line")
      .style({
        stroke: "#556270",
        "shape-rendering": "geometricPrecision"
      })
      .attr("id", function (d, i) {
        d.index = i;
        return "link" + i;
      });

    vis.selectAll(".term")
      .data(terms)
    .enter().append("circle")
      .attr("r", termRadius)
      .attr("id", nodeId)
      .classed({term: true, node: true})
      .style({
        opacity: 0.9,
        fill: "#4ECDC4",
        stroke: "#4194cd",
        "stroke-width": 2
      })
      .call(drag);

    vis.selectAll(".gene")
      .data(genes)
    .enter().append("circle")
      .attr("r", function (d) { return d.r = d.pr = 10; })
      .attr("id", nodeId)
      .classed({gene: true, node: true})
      .style({
        opacity: 0.9,
        fill: "#C7F464",
        stroke: "#67c822",
        "stroke-width": 2
      })
      .call(drag)
      .call(tip);

    var bubbles = vis.selectAll(".node");
    bubbles
      .on("mouseover.node.tip", tip.show)
      .on("mouseout.node.tip", tip.hide)
      .on("mouseover.node.transition", highlightNode)
      .on("mouseout.node.transition", restoreNode);

    //   .on("click.node.highlight", function (d) {
    //     // Ignore drag
    //     if (d3.event.defaultPrevented) {
    //       return;
    //     }
    //     highlightNeighbors(d);
    //   });

    // d3.select(window)
    //   .on("click.node.highlight", function () {
    //     unhighlightNeighbors();
    //   });

    var textGroup = vis.append("svg:g").attr("class", "node-text");

    textGroup.selectAll(".term-label")
      .data(terms)
    .enter()
      .append("svg:g")
      .append("svg:text")
      .attr("class", "term-label")
      .style({
        "text-anchor": "middle",
        "shape-rendering": "crispEdges"
      })
      .text(function (d) {
        return d.description.length > 28 ? d.description.substr(0, 25) + "..." : d.description;
      });

    textGroup.selectAll(".gene-label")
      .data(genes)
    .enter()
      .append("svg:g")
      .append("svg:text")
      .attr("class", "gene-label")
      .style({
        "text-anchor": "middle",
        "shape-rendering": "crispEdges",
        "font-size": "0.7em"
      })
      .text(function (d) {
        return d.id;
      });

    var text = textGroup.selectAll("g");

    // function highlightNeighbors(d) {
    //   bubbles.classed("obscure", true);
    //   links.classed("obscure", true);
    //   text.classed("obscure", true);
    //   var ne = getAllNeighbors(d.index);
    //   ne.forEach(function (el) {
    //     if (el.type) {
    //       // it's a node
    //       nodes[0][el.index]
    //     }
    //   });
    // }

    // function unhighlightNeighbors() {}

    function nodeId (d) { return normalizeId(d.id); }

    function onlyTerm(n) {
      return n.type === "term";
    }

    function getPvalue (t) {
      return parseFloat(t.pvalue);
    }

    function zooming() {
      vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
      /*jshint validthis:true */
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function dragging(d) {
      // NOTE: maybe nodes must unfixed before?
      var x = d.x - d.px;
      var y = d.y - d.py;
      container.selectAll(".node-selected")
        .attr("cx", function (sd) {
          if (d !== sd) {
            sd.px = sd.x;
            sd.x += x;
          }
          return sd.x;
        })
        .attr("cy", function (sd) {
          if (d !== sd) {
            sd.py = sd.y;
            sd.y += y;
          }
          return sd.y;
        });
    }

    function dragended(d) {
      /*jshint validthis:true */
      d3.select(this).classed("dragging", false);
    }

    function connections(terms, edges) {
      var genesAndEdges = takeTermsNeighbors(terms, edges);
      return genesAndEdges;
    }

    function putSourceTargetRef(nodes, edges) {
      for (var i = 0, ii = edges.length; i < ii; ++i) {
        replaceIdWithReference(nodes, edges[i]);
      }
    }

    function replaceIdWithReference(nodes, edge) {
      var s = edge.source, t = edge.target, i = 0, n, ii = nodes.length, id;
      while(i < ii && (typeof s === "string" || typeof t === "string")) {
        n = nodes[i];
        id = n.id;
        if (s === id) {
          edge.source = s = n;
        } else if (t === id) {
          edge.target = t = n;
        }
        ++i;
      }
    }

    function takeTermsNeighbors(terms, edges) {
      var term, edge, q = [], pushed = false, cmplE = 0, tmp;
      for (var t = 0, tt = terms.length; t < tt; ++t) {
        term = terms[t];
        for (var i = 0 + cmplE, ii = edges.length; i < ii; ++i) {
          edge = edges[i];
          if (edge.target === term && q.indexOf(edge.target) === -1) {
            q.push(edge.source);
            pushed = true;
          } else if (edge.source === term && q.indexOf(edge.source) === -1) {
            q.push(edge.target);
            pushed = true;
          }

          if (pushed) {
            // This edge cannot add any other gene so put it at the beginning
            // instead of remove it.
            pushed = false;
            tmp = edges[cmplE];
            edges[cmplE] = edge;
            edges[i] = tmp;
            ++cmplE;
          }
        }
      }
      return [q, cmplE > 0 ? edges.slice(0, cmplE) : []];
    }

    function termRadius(d) {
      var den = pvalueExtent[1] - pvalueExtent[0];
      return d.r = d.pr = den === 0 ? 13 : (1 - (parseFloat(d.pvalue) - pvalueExtent[0]) / (pvalueExtent[1] - pvalueExtent[0])) * 30 + 13;
    }

    // function getNeighbors (nodeIndex) {
    //   // From d3's src/layout/force.js
    //   var ne = neighbors, ee = neighborEdges, n, m, j;
    //   if (!ne.length) {
    //     // All the nodes: terms + genes
    //     n = nodes.length;
    //     m = edges.length;
    //     ne = new Array(n);
    //     for (j = 0; j < n; ++j) {
    //       ne[j] = [];
    //       ee[j] = [];
    //     }
    //     for (j = 0; j < m; ++j) {
    //       var o = edges[j];
    //       ne[o.source.index].push(o.target);
    //       ne[o.target.index].push(o.source);
    //       ee[o.source.index].push(o);
    //       ee[o.target.index].push(o);
    //     }
    //   }
    //   return ne[nodeIndex];
    // }

    // function getAllNeighbors (nodeIndex) {
    //   var ee = neighborEdges;
    //   return getNeighbors(nodeIndex).concat(ee[nodeIndex]);
    // }

    /**
     * Places elements along a circle perimenter at equal distance from each other.
     *
     * @param {Array.<Object>} nodes - elements on which set coordinates.
     * @param {Object} circle - e.g.
     * {
     *    centre: [0, 0],
     *    radius: 50,
     *    offset: 20
     * }
     */
    function placeAlongCircle(nodes, circle) {
      var k = nodes.length, dist = 360/k * Math.PI/180, pos = dist;
      var centre = circle.centre || [0, 0];
      var r = circle.radius || 50;
      var offset = circle.offset || 20;

      nodes.forEach(function(d, i) {         // (-offset, offset): add error to the position
        d.x = centre[0] + r * Math.cos(pos) + (-offset + Math.random() * 2 * offset);
        d.y = centre[1] + r * Math.sin(pos) + (-offset + Math.random() * 2 * offset);
        pos += dist;
      });
    }

    function cx (d) { return d.x; }
    function cy (d) { return d.y; }

    function fociTick (e) {
      bubbles.attr({
        cx: cx, cy: cy
      });

      links.attr({
        x1: function(d) { return d.source.x; },
        y1: function(d) { return d.source.y; },
        x2: function(d) { return d.target.x; },
        y2: function(d) { return d.target.y; }
      });

      text.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }

    function fixEles() {
      force.nodes().forEach(function (d) {
        d.fixed = true;
      });
    }

    function highlightNode (d) {
      if (d.pr === d.r) {
        /* jshint validthis:true */
        var n = d3.select(this);
        n.transition().attr("r", d.r = d.r * 1.5);
        n.classed("node-selected", true);
      }
    }

    function restoreNode (d) {
      /* jshint validthis:true */
      var n = d3.select(this);
      d3.select(this).transition().attr("r", d.r = d.pr);
      n.classed("node-selected", false);
    }

    function normalizeId(id) {
      // a number is not a valid id...
      return "e"+id.replace(/[:;,\.]*/g, "");
    }

    return {
      hn: [],

      remove: function () {
          vis.remove();
          container.select("svg").remove();
      },


      highlightNode: function (id) {
        var n = document.querySelector("#"+normalizeId(id));
        if (n) {
          highlightNode.call(n, n.__data__);
          this.hn.push(n);
        }
      },

      restoreNodes: function () {
        this.hn.forEach(function (n, i) {
          restoreNode.call(n, n.__data__);
        });
        this.hn = [];
      }
    };
  };
}).call(this, d3);


angular.module("martVisualEnrichment.directives").

directive("mvGraph",
          ["$rootScope", "progressState", "$timeout",
          function ($rootScope, state, $timeout) {
    /* global cytoscape: false */
    function link (scope, iElement, iAttrs) {
        var vis = null;
        $timeout(function () {
          var container = iElement.find("div").eq(0)
          vis = graph(
            scope.nodes,
            scope.edges,
            { container: container[0],
              width: iElement.width(),
              height: iElement.height()
          });

          iElement.find(".save-png").on("click", function () {
            downloadPng(iElement.find("div").eq(0)[0]);
          });

          iElement.find(".save-svg").on("click", function () {
            downloadSvg(iElement.find("div").eq(0)[0]);
          });

          iElement.find(".save-json").on("click", function () {
            downloadJson({ nodes: scope.nodes, edges: scope.edges });
          });

          iElement.find(".save-tsv").on("click", function () {
            downloadTsv({ nodes: scope.nodes, edges: scope.edges });
          });

          var moHandler = $rootScope.$on("term.mouseover", function (evt, term) {
              vis.highlightNode(term["id"]);
          });
          var moutHandler = $rootScope.$on("term.mouseout", function (evt, term) {
              vis.restoreNodes(term["id"]);
          });
          scope.$on("$destroy", function () {
              vis.remove();
              moHandler();
              moutHandler();
          });
        }, 200);

        state.setState(state.states.NETWORK);

        var angularInitialization = true;
        scope.$watch(function (scope) {
            return scope.filterPattern;
        }, function (newPattern, oldPattern) {
            if (angularInitialization) {
                angularInitialization = false;
            } else {
                if (newPattern !== oldPattern) {
                    // updateGraph(scope, newPattern);
                }
            }
        });


    }
    return {
        restrict: "E",
        replace: true,
        templateUrl: "mart-visual-enrichment/app/partials/vis.html",
        scope: {
            nodes: "=nodes",
            edges: "=edges",
            filterPattern: "="
        },
        compile: function (tElement) {
            var h = angular.element(window).prop("innerHeight");
            tElement.css("height", h + "px");
            return link;
        }
    };
}]);

})(angular, d3);