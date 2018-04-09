/**
 * Bar Chart
 * @author Linh
 */

;
(function($, window, document, undefined) {

	"use strict";

	var pluginName = "ims2StackBar", defaults = {
		width: 600,
		height: 500,
		padding : {top: 40, right: 40, bottom: 40, left:40},
		dataSource: "",
		scaleType: "M",//M, H
		legend: {
			    0 : ["Invite","#1f77b4"],
				1 : ["Accept","#2ca02c"],
				2 : ["Decline","#ff7f0e"]
		},
		target: "div",
		yLabel: "Y Label",
		xLabel: "X Label",
		title: "Chart"
	};

	function Plugin(element, options) {
		this.element = element;

		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.comps = {};
		this.init();
	}

	$.extend(Plugin.prototype, {
		init : function() {
			this._draw();
		},
		_draw : function() {
			var w = this.settings.width;                        
			var h = this.settings.height;                        
			var padding = this.settings.padding;
			var dataset;
			//Set up stack method
			var stack = d3.layout.stack();
			var that = this;

			d3.json(this.settings.dataSource,function(json){
				dataset = json;
				//Data, stacked
				stack(dataset);
				var color_hash = that.settings.legend;

				//Set up scales
				that.comps.xScale = d3.time.scale()
					.domain(that._getDomain(dataset,that.settings.scaleType))
					.rangeRound([0, w-padding.left-padding.right]);

				that.comps.yScale = d3.scale.linear()
					.domain([0,				
						d3.max(dataset, function(d) {
							return d3.max(d, function(d) {
								return d.y0 + d.y;
							});
						})
					])
					.range([h-padding.bottom-padding.top,0]);

				that.comps.xAxis = d3.svg.axis()
							   .scale(that.comps.xScale)
							   .orient("bottom")
							   .ticks(d3.time.days,1);

				that.comps.yAxis = d3.svg.axis()
							   .scale(that.comps.yScale)
							   .orient("left")
							   .ticks(10);


				//Easy colors accessible via a 10-step ordinal scale
				var colors = d3.scale.category10();

				//Create SVG element
				that.comps.svg = d3.select(that.settings.target)
							.append("svg")
							.attr("width", w)
							.attr("height", h);

				// Add a group for each row of data
				that.comps.groups = that.comps.svg.selectAll("g")
					.data(dataset)
					.enter()
					.append("g")
					.attr("class","rgroups")
					.attr("transform","translate("+ padding.left + "," + (h - padding.bottom) +")")
					.style("fill", function(d, i) {
						return color_hash[dataset.indexOf(d)][1];
					});

				// Add a rect for each data value
				that.comps.rects = that.comps.groups.selectAll("rect")
					.data(function(d) { return d; })
					.enter()
					.append("rect")
					.attr("width", 2)
					.style("fill-opacity",1e-6);


				that.comps.rects.transition()
				     .duration(function(d,i){
				    	 return 500 * i;
				     })
				     .ease("linear")
				    .attr("x", function(d) {
						return that.comps.xScale(new Date(d.time));
					})
					.attr("y", function(d) {
						return -(- that.comps.yScale(d.y0) - that.comps.yScale(d.y) + (h - padding.top - padding.bottom)*2);
					})
					.attr("height", function(d) {
						return -that.comps.yScale(d.y) + (h - padding.top - padding.bottom);
					})
					.attr("width", 15)
					.style("fill-opacity",1);

					that.comps.svg.append("g")
						.attr("class","x axis")
						.attr("transform","translate(40," + (h - padding.bottom) + ")")
						.call(that.comps.xAxis);


					that.comps.svg.append("g")
						.attr("class","y axis")
						.attr("transform","translate(" + padding.left + "," + padding.top + ")")
						.call(that.comps.yAxis);

					// adding legend

					that.comps.legend = that.comps.svg.append("g")
									.attr("class","legend")
									.attr("x", w - padding.right - 65)
									.attr("y", 25)
									.attr("height", 100)
									.attr("width",100);

					that.comps.legend.selectAll("g").data(dataset)
						  .enter()
						  .append('g')
						  .each(function(d,i){
						  	var g = d3.select(this);
						  	g.append("rect")
						  		.attr("x", w - padding.right - 65)
						  		.attr("y", i*25 + 10)
						  		.attr("width", 10)
						  		.attr("height",10)
						  		.style("fill",color_hash[String(i)][1]);

						  	g.append("text")
						  	 .attr("x", w - padding.right - 50)
						  	 .attr("y", i*25 + 20)
						  	 .attr("height",30)
						  	 .attr("width",100)
						  	 .style("fill",color_hash[String(i)][1])
						  	 .text(color_hash[String(i)][0]);
						  });

					that.comps.svg.append("text")
					.attr("transform","rotate(-90)")
					.attr("y", 0 - 5)
					.attr("x", 0-(h/2))
					.attr("dy","1em")
					.text(that.settings.yLabel);

					that.comps.svg.append("text")
				   .attr("class","xtext")
				   .attr("x",w/2 - padding.left)
				   .attr("y",h - 5)
				   .attr("text-anchor","middle")
				   .text(that.settings.xLabel);

					that.comps.svg.append("text")
		        .attr("class","title")
		        .attr("x", (w / 2))             
		        .attr("y", 20)
		        .attr("text-anchor", "middle")  
		        .style("font-size", "16px") 
		        .style("text-decoration", "underline")  
		        .text(that.settings.title);

			});
		},
		_getDomain: function(dataset,type){
			if (type === "M"){
				return [new Date(dataset[0][0].time),d3.time.day.offset(new Date(dataset[0][dataset[0].length-1].time),8)];
			}
			
			if (type === "H"){
				return [new Date(0, 0, 0,dataset[0][0].time,0, 0, 0),new Date(0, 0, 0,dataset[0][dataset[0].length-1].time,0, 0, 0)];
			}
		},
		update: function(param){
			var w = this.settings.width;                        
			var h = this.settings.height;                        
			var padding = this.settings.padding;
			var that = this;
			var dataset;
			//Set up stack method
			var stack = d3.layout.stack();
			d3.json(param.jsonUrl,function(json){

				dataset = json;
				stack(dataset);

				that.comps.xScale.domain(that._getDomain(dataset,param.scaleType))
				.rangeRound([0, w-padding.left-padding.right]);

				that.comps.yScale.domain([0,				
								d3.max(dataset, function(d) {
									return d3.max(d, function(d) {
										return d.y0 + d.y;
									});
								})
							])
							.range([h-padding.bottom-padding.top,0]);

				that.comps.xAxis.scale(that.comps.xScale)
				     .ticks(d3.time.hour,2)
				     .tickFormat(d3.time.format("%H"));

				that.comps.yAxis.scale(that.comps.yScale)
				     .orient("left")
				     .ticks(10);

				that.comps.groups = that.comps.svg.selectAll(".rgroups")
                    .data(dataset);

				that.comps.groups.enter().append("g")
                    .attr("class","rgroups")
                    .attr("transform","translate("+ padding.left + "," + (h - padding.bottom) +")")
                    .style("fill",function(d,i){
                        return color(i);
                    });


				that.comps.rect = that.comps.groups.selectAll("rect")
                    .data(function(d){return d;});

				that.comps.rect.enter()
                      .append("rect")
                      .attr("x",w)
                      .attr("width",1)
                      .style("fill-opacity",1e-6);

				that.comps.rect.transition()
                    .duration(1000)
                    .ease("linear")
                    .attr("x",function(d){
                        return that.comps.xScale(new Date(0, 0, 0,d.time,0, 0, 0));
                    })
                    .attr("y",function(d){
                        return -(- that.comps.yScale(d.y0) - that.comps.yScale(d.y) + (h - padding.top - padding.bottom)*2);
                    })
                    .attr("height",function(d){
                        return -that.comps.yScale(d.y) + (h - padding.top - padding.bottom);
                    })
                    .attr("width",15)
                    .style("fill-opacity",1);

				that.comps.rect.exit()
			       .transition()
			       .duration(1000)
			       .ease("circle")
			       .attr("x",w)
			       .remove();

				that.comps.groups.exit()
			       .transition()
			       .duration(1000)
			       .ease("circle")
			       .attr("x",w)
			       .remove();


				that.comps.svg.select(".x.axis")
				   .transition()
				   .duration(1000)
				   .ease("circle")
				   .call(that.comps.xAxis);

				that.comps.svg.select(".y.axis")
				   .transition()
				   .duration(1000)
				   .ease("circle")
				   .call(that.comps.yAxis);

				that.comps.svg.select(".xtext")
				   .text(param.xLabel);

				that.comps.svg.select(".title")
		        .text(param.title);
			});			
		}
	});

	$.fn[pluginName] = function(option,param) {
		var options = typeof option == "object" && option;

		return this.each(function() {
			var $this = $(this);
			var $plugin = $this.data("plugin");

			if (!$plugin) {
				$plugin = new Plugin($this, options);
				$this.data("plugin", $plugin);
			}

			if (typeof option == 'string') {
				$plugin[option](param);
			}
		});

	};

})(jQuery, window, document);