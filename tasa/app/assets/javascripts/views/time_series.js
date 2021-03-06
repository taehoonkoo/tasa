(function() {
  'use strict';
  window.TimeSeriesView = SpinnerView.extend({
    template: 'templates/time_series',

    decorator: function(options) {
      if (options.loading) { return {}; }

      var types = this.model.first().get('tweets');
      return [
          _.has(types, 'total') && {
          name: 'Total tweets',
          className: 'total',
          color: 'rgba(234, 239, 235, .8)',
          data: this.model.map(function(model, i) { return {x: i, y: model.get('counts').total, posted_date: model.get('posted_date')}; })
        },
        _.has(types, 'positive') && {
          name: 'Positive tweets',
          className: 'positive',
          color: '#80a55d',
          data: this.model.map(function(model, i) { return {x: i, y: model.get('counts').positive, posted_date: model.get('posted_date')}; })
        },
        _.has(types, 'negative') && {
          name: 'Negative tweets',
          className: 'negative',
          color: '#ce522c',
          data: this.model.map(function(model, i) { return {x: i, y: model.get('counts').negative, posted_date: model.get('posted_date')}; })
        },
        _.has(types, 'neutral') && {
          name: 'Neutral tweets',
          className: 'neutral',
          color: 'rgba(234, 239, 235, .3)',
          data: this.model.map(function(model, i) { return {x: i, y: model.get('counts').neutral, posted_date: model.get('posted_date')}; })
        }
      ].filter(Boolean);
    },

    render: function(options) {
      var self = this;
      SpinnerView.prototype.render.call(this, options);
      if (options.loading) { return; }

      var series = this.decorator(options),
          max = _.chain(this.model.pluck('counts'))
            .map(function(counts) { return _.omit(counts, _.size(counts) > 1 && 'total'); })
            .map(_.max)
            .max()
          .value();

      var graph = new Rickshaw.Graph({
        element: this.$('.graph')[0],
        renderer: 'line',
        height: 300,
        series: series,
        max: max * 1.1
      });

      graph.onUpdate(function() {
        d3.select(self.$('.graph svg').selector)
          .selectAll('rect.weekend')
          .data(_.select(series[0].data, function(point) {
            return _.contains(['Sat', 'Sun'], d3.time.format.utc('%a')(point.posted_date));
          }))
          .enter()
            .insert('g', 'svg > path:first-of-type')
              .attr('class', 'weekend')
              .attr('transform', function(d) { return 'translate(' + graph.x(d.x)  + ', 0)'; })
              .call(function(g) {
                g.each(function(d, i) {
                  var container = d3.select(g[0][i]);
                  container.append('text')
                    .attr('dx', function(d) { return (graph.x(d.x + 1) - graph.x(d.x)) / 2; })
                    .attr('dy', '1em')
                    .attr('text-anchor', 'middle')
                    .text(function(d) { return d3.time.format.utc('%a')(d.posted_date); });
                  container.append('rect')
                    .attr('width', function(d) { return graph.x(d.x + 1) - graph.x(d.x); })
                    .attr('height', graph.y.range()[0] - graph.y.range()[1])
                  ;
                });
              })
        ;
      });

      new Rickshaw.Graph.Axis.Y({
        element: this.$('.y-axis-left')[0],
        graph: graph,
        orientation: 'left',
        width: 40,
        height: 300,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT
      });

      new Rickshaw.Graph.Axis.Y({
        element: this.$('.y-axis-right')[0],
        graph: graph,
        orientation: 'right',
        width: 40,
        height: 300,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT
      });

      new Rickshaw.Graph.Axis.X({
        element: this.$('.x-axis')[0],
        graph: graph,
        orientation: 'bottom',
        tickFormat: function(i) { return d3.time.format.utc('%B %e')(self.model.at(i).get('posted_date')); }
      });

      new Rickshaw.Graph.HoverDetail({
        graph: graph,
        formatter: function(series, i, tweets) {
          var postedDate = series.data[i].posted_date,
              sentiment = ({positive: 'positive', negative: 'negative', neutral: 'neutral', total: ''})[series.className];
          return '' +
            '<div data-sentiment="' + sentiment + '" data-posted-date="' + Number(postedDate) + '" style="color:' + series.color + '">' +
              '<span class="date">' + d3.time.format.utc('%B %e')(postedDate) + '</span>' +
              '<span class="tweets">' + series.data[i].y + '</span>' +
              '<span class="units">tweets</span>' +
            '</div>'
          ;
        }
      });

      new Rickshaw.Graph.Legend({
        element: this.$('.legend')[0],
        graph: graph
      });

      graph.render();
    }
  });
})();