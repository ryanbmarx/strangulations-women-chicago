import * as d3 from 'd3';

class BarChart{
	constructor(options){
		const app = this;
		app.options = options;
		app._container = options.container
		app.meta = options.meta;
		app.initChart(options.dataset);
	}

	initChart(data){
		let app = this;

		// ----------------------------------
		// GET THE KNOW THE CONTAINER
		// ----------------------------------

		const 	container = d3.select(app._container),
				bbox = 	app._container.getBoundingClientRect(), 
				height=bbox.height,
				width=bbox.width,
				margin = app.options.innerMargins,
				innerHeight = height - margin.top - margin.bottom,
				innerWidth = width - margin.right - margin.left,
				y = app.options.yAttribute, 
				x = app.options.xAttribute;

		// ----------------------------------
		// MAKE SCALES
		// ----------------------------------

		// If the user has defined min or max values for the x range, such as starting at zero,
		// then use those values. Otherwise, find them.
		const 	yMax = app.options.yMax ? parseFloat(app.options.yMax) : d3.max(data, d => parseFloat(d[y])),
				yMin = app.options.yMin ? parseFloat(app.options.yMin) : d3.min(data, d => parseFloat(d[y]));

		//Scale functions
		//This is the y scale used to size and position the bars
		const yScale = d3.scaleLinear()
			.domain([yMin, yMax])
			.nice()
			.range([innerHeight, 0]);


		// If the user has defined min or max values for the x range, such as starting at zero,
		// then use those values. Otherwise, find them.
		const 	xMax = app.options.xMax ? parseFloat(app.options.xMax) : d3.max(data, d => parseFloat(d[x])),
				xMin = app.options.xMin ? parseFloat(app.options.xMin) : d3.min(data, d => parseFloat(d[x]));

		// Make the x scale
		const xScale = d3.scaleBand()
			.domain(data.map(d => d[x]))
			.range([0, innerWidth])
			.padding(.1);

		// ----------------------------------
		// START MESSING WITH SVGs
		// ----------------------------------

		//Inserts svg and sizes it
		const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height);

		const chartInner = svg.append('g')
			.classed('chartInner', true)
			.attr("width",innerWidth)
			.attr("height",innerHeight)
			.attr(`transform`,`translate(${margin.left},${margin.top})`);

		// ----------------------------------
		// APPEND <g> ELEMENTS FOR SCALES 
		// ----------------------------------

		if (app.options.showYAxis){
			// Define the y axis and add a tick formatter if a format string is define in the options.
			const yAxis = d3.axisLeft(yScale);

			// If the user has defined a format function
			if (app.options.axisFormatter.yAxis){
				const yFormatter = app.options.axisFormatter.yAxis;
				yAxis.tickFormat(yFormatter)
			}
			// If the user has defined the desired # ticks ...
			if (app.options.ticks.yAxis){
				yAxis.ticks(app.options.ticks.yAxis);
			}
		   svg.append('g')
				.attr("class", "y axis")
				.attr(`transform`,`translate(${margin.left},${margin.top})`)
				.call(yAxis)
				.select('.domain').remove();
		}
		
		if (app.options.showXAxis){
			// Create an x axis if the option requires it

			// Define the x axis 
			const xAxis = d3.axisBottom(xScale);

			// ... add a tick formatter if a format fucntion is supplied in the options.
			if (app.options.axisFormatter.xAxis){
				const xFormatter = app.options.axisFormatter.xAxis;
				xAxis.tickFormat(xFormatter)
			}

			// If the user has defined the desired # ticks ...
			if (app.options.ticks.xAxis){
				xAxis.ticks(app.options.ticks.xAxis);	
			}
			// Now, append the axis elements to the SVG
		   svg.append('g')
				.attr("class", "x axis")
				.attr(`transform`,`translate(${ margin.left },${ margin.top + innerHeight })`)
				.transition()
					.duration(app.options.transitionTime)
					.call(xAxis);

	        if (app.options.removeXAxisDomain){
	        	d3.select('.x.axis').selectAll('.domain').remove();
	        }

	        if (app.options.removeXAxisTickMarks){
	        	d3.select('.x.axis').selectAll('.tick line').remove();
	        	d3.select('.x.axis').selectAll('.tick text').attr('dy', '.3em');
	        }

		}

		// ----------------------------------
		// ADD SOME FRIGGIN' BARS!
		//		     ~  ~
		//	      ( o )o)
		//	     ( o )o )o)
		//	   (o( ~~~~~~~~o
		//	   ( )' ~~~~~~~'
		//	   ( )|)       |-.
		//	     o|     _  |-. \
		//	     o| |_||_) |  \ \
		//	      | | ||_) |   | |
		//	     o|        |  / /
		//	      |        |." "
		//	      |        |- '
		//	      .========.   mb
		// ----------------------------------



		chartInner.selectAll('.bar')
			.data(data)
			.enter()
			.append('rect')
			.attr('class', d => d[y] >=0 ? `bar bar--positive bar--${d[x]}` : `bar bar--negative bar--${d[x]}`)
			.attr('x', d => xScale(d[x]))
			.attr('y', d => d[y] >=0 ? yScale(0)- Math.abs(yScale(d[y]) - yScale(0)) : yScale(0))
			.attr("width", xScale.bandwidth())
	        .attr("height", function(d) {
	            return Math.abs(yScale(d[y]) - yScale(0));
	        })
			.style('fill', app.options.barFillColor)


		// ----------------------------------
		// ADD THE META LABELING
		// ----------------------------------
		
		if (app.meta){
			// Add the <g> for the labeling, and hang some base styles on it.
			// Only text attr/style that differs from this needs to be applied.
			const labels = svg.append('g')
				.classed('chart-labels', true)
				.style('font-family','Arial, sans-serif')
				.style('font-size','13px')
				.style('font-weight','bold')
				.style('margin','0 0 0 0')
				.style('line-height', '1.3em')
				.attr('text-anchor', 'middle')
				.attr('dy', '1em');

			if (app.meta.headline){
				labels.append('text')
					.classed('chart-labels__headline', true)
					.text(`${app.meta.headline}`)
					.style('font-size','19px')
					.attr('x', 0)
					.attr('y', 0)
					.attr('text-anchor', 'start');
			}
			if (app.meta.xAxisLabel){
				labels.append('text')
					.classed('chart-labels__xAxisLabel', true)
					.text(`${app.meta.xAxisLabel}`)
					.attr('x', margin.left + (innerWidth / 2))
					.attr('y', height)
					.attr('dy', '-.3em');
					
			}
			if (app.meta.yAxisLabel){
				labels.append('text')
					.classed('chart-labels__yAxisLabel', true)
					.text(`${app.meta.yAxisLabel}`)
					.attr('x', 0)
					.attr('y', margin.top + (innerHeight / 2))
					.attr('transform', `rotate(-90, 0, ${margin.top + (innerHeight / 2)})`)
									.attr('dy', '1em');
			}

			if (app.meta.sources){
				container.append('p')
					.classed('chart-labels__source', true)
					.style('font-weight','normal')
					.text(`${app.meta.sources}`);
			}

			if(app.meta.credit){
				container.append('p')
					.classed('chart-labels__credit', true)
					.text(`${app.meta.credit}`)
					.style('font-family','Arial, sans-serif')
					.style('font-size','13px')
					.style('margin','7px 0 0 0')
					.style('line-height', '1.3em');
			}
		}

     }
}


module.exports = BarChart;