



import ApexCharts from 'apexcharts';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('salesPurchaseChart')) {
      const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8080' : '';
      const rangeSelect = document.querySelector('[data-sales-purchase-range]');
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      function moneyLabel(value) {
        return '$' + Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
      }

      function orderDate(order) {
        return order && order.createdAt ? new Date(order.createdAt) : new Date();
      }

      function emptyBuckets(range) {
        if (range === 'week') {
          return {
            categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            sales: Array(7).fill(0),
            purchase: Array(7).fill(0)
          };
        }
        if (range === 'month') {
          return {
            categories: Array.from({ length: 31 }, (_, index) => String(index + 1)),
            sales: Array(31).fill(0),
            purchase: Array(31).fill(0)
          };
        }
        return {
          categories: monthLabels,
          sales: Array(12).fill(0),
          purchase: Array(12).fill(0)
        };
      }

      function reportSeries(orders, range) {
        const buckets = emptyBuckets(range);
        const now = new Date();
        orders.forEach(order => {
          const date = orderDate(order);
          if (range === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            if (date < start || date > now) return;
            const index = date.getDay();
            const value = Number(order.total || 0);
            buckets.sales[index] += value;
            buckets.purchase[index] += value * 0.62;
            return;
          }
          if (range === 'month') {
            if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return;
            const index = date.getDate() - 1;
            const value = Number(order.total || 0);
            buckets.sales[index] += value;
            buckets.purchase[index] += value * 0.62;
            return;
          }
          if (date.getFullYear() !== now.getFullYear()) return;
          const index = date.getMonth();
          const value = Number(order.total || 0);
          buckets.sales[index] += value;
          buckets.purchase[index] += value * 0.62;
        });
        buckets.sales = buckets.sales.map(value => Number(value.toFixed(2)));
        buckets.purchase = buckets.purchase.map(value => Number(value.toFixed(2)));
        return buckets;
      }

      async function loadOrders() {
        const response = await fetch(API_BASE + '/api/admin/orders');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Cannot load customer orders.');
        return data.orders || [];
      }

      function salesPurchaseOptions(data) {
        return {
      series: [
        {
          name: 'Sales',
          data: data.sales,
        },
        {
          name: 'Purchase',
          data: data.purchase,
        },

      ],
      colors: ['#E66239', '#4FAF7A'],
      chart: {
        type: 'bar',
        height: 350,
        width: '100%',
        parentHeightOffset: 0,
        toolbar: {
          show: false,
        },
      },
      grid: {
        show: true,
        borderColor: "#e2e8f0",

      },
      legend: {
        show: true,
        fontFamily: 'Poppins, serif',
        fontWeight: 500,
        markers: {
          size: 5,
          shape: 'square',
          strokeWidth: 0,
          fillColors: undefined,
          customHTML: undefined,
          onClick: undefined,
          offsetX: -2,
          offsetY: 0,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '85%',
          borderRadius: 3,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: false,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: data.categories,
        tickAmount: Math.min(data.categories.length - 1, 11),
        labels: {
          rotate: data.categories.length > 12 ? -45 : 0,
          trim: true,
        },
        axisBorder: {
          show: false,
          color: "#e2e8f0",
          height: 1,
          width: '100%',
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: false,
          borderType: 'solid',
          color: "#e2e8f0",
          height: 6,
          offsetX: 0,
          offsetY: 0,
        },
      },

      yaxis: {
        labels: {
          formatter: function (e) {
            return moneyLabel(e);
          },
        },
        title: {
          text: '$' ,
        },
      },
      fill: {
        opacity: 1,
      },
     tooltip: {
    			y: {
    				formatter: function (val) {
    					return moneyLabel(val)
    				}
    			}
    		},
    };
      }

      const chartEl = document.querySelector("#salesPurchaseChart");
      let chart = null;
      let salesPurchaseOrders = [];

      function updateSalesPurchase(range) {
        const data = reportSeries(salesPurchaseOrders, range || 'year');
        if (chart) chart.destroy();
        chart = new ApexCharts(chartEl, salesPurchaseOptions(data));
        chart.render();
      }

      updateSalesPurchase(rangeSelect ? rangeSelect.value : 'year');

      if (rangeSelect) {
        rangeSelect.addEventListener('change', () => {
          updateSalesPurchase(rangeSelect.value);
        });
      }

      loadOrders().then(orders => {
        salesPurchaseOrders = orders;
        updateSalesPurchase(rangeSelect ? rangeSelect.value : 'year');
      }).catch(error => {
        console.warn(error.message);
        updateSalesPurchase(rangeSelect ? rangeSelect.value : 'year');
      });
    }
      if (document.getElementById('customerChart')) {
    const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8080' : '';
    const customerRange = document.querySelector('[data-customer-range]');

    function customerCutoff(range) {
      const now = new Date();
      const start = new Date(now);
      if (range === 'week') start.setDate(now.getDate() - 6);
      else if (range === 'month') start.setDate(1);
      else start.setMonth(now.getMonth() - 5, 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    function customerBreakdown(orders, range) {
      const cutoff = customerCutoff(range);
      const counts = {};
      (orders || []).forEach(order => {
        const created = order.createdAt ? new Date(order.createdAt) : new Date();
        if (created < cutoff) return;
        const customer = order.userId || (order.customer && order.customer.email) || 'guest';
        counts[customer] = (counts[customer] || 0) + 1;
      });
      const values = Object.values(counts);
      const first = values.filter(count => count === 1).length;
      const returning = values.filter(count => count > 1).length;
      const total = first + returning;
      return {
        first,
        returning,
        series: total ? [
          Math.round((first / total) * 100),
          Math.round((returning / total) * 100)
        ] : [0, 0]
      };
    }

    function setCustomerText(selector, value) {
      const el = document.querySelector(selector);
      if (el) el.textContent = value;
    }

    async function loadCustomerOrders() {
      const response = await fetch(API_BASE + '/api/admin/orders');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cannot load customer orders.');
      return data.orders || [];
    }

    var options = {
      series: [0, 0],
      chart: {
        height: 200,
        type: 'radialBar',
      },
      colors: ['#E66239', '#F6B73C'],
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '22px',
            },
            value: {
              fontSize: '16px',
            },
            total: {
              show: false,
            },
          },
          hollow: {
            margin: 3,
            size: '40%',
            background: 'transparent',
            image: undefined,
            imageWidth: 150,
            imageHeight: 150,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageClipped: true,
            position: 'front',
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5,
            },
          },
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "#f0f0f0",
            strokeWidth: '45%',
            opacity: 1,
            margin: 5,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5,
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.35,
          gradientToColors: ['#FFB088', '#FFE08A'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 55, 100],
        },
      },
      stroke: {
        lineCap: 'round',
      },
 labels: ['First Time', 'Return' ],

    };

    var chart = new ApexCharts(document.querySelector('#customerChart'), options);
    chart.render();
    let customerOrders = [];

    function updateCustomerChart(range) {
      const data = customerBreakdown(customerOrders, range || 'six-months');
      chart.updateSeries(data.series);
      setCustomerText('[data-admin-summary="first-time"]', String(data.first));
      setCustomerText('[data-admin-summary="returning"]', String(data.returning));
      setCustomerText('[data-customer-percent="first"]', data.series[0] + '%');
      setCustomerText('[data-customer-percent="return"]', data.series[1] + '%');
    }

    if (customerRange) {
      customerRange.addEventListener('change', () => {
        updateCustomerChart(customerRange.value);
      });
    }
    updateCustomerChart(customerRange ? customerRange.value : 'six-months');

    loadCustomerOrders().then(orders => {
      customerOrders = orders;
      updateCustomerChart(customerRange ? customerRange.value : 'six-months');
    }).catch(error => {
      console.warn(error.message);
      updateCustomerChart(customerRange ? customerRange.value : 'six-months');
    });
  }
   if (document.getElementById('salesChart')) {
    const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8080' : '';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let salesThisYear = Array(12).fill(0);
    let salesLastYear = Array(12).fill(0);

    function monthlySales(orders) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const previousYear = currentYear - 1;
      const current = Array(12).fill(0);
      const previous = Array(12).fill(0);
      (orders || []).forEach(order => {
        const date = order.createdAt ? new Date(order.createdAt) : null;
        if (!date) return;
        const total = Number(order.total || 0);
        if (date.getFullYear() === currentYear) current[date.getMonth()] += total;
        if (date.getFullYear() === previousYear) previous[date.getMonth()] += total;
      });
      salesThisYear = current.map(value => Number(value.toFixed(2)));
      salesLastYear = previous.map(value => Number(value.toFixed(2)));
    }

    async function loadReportOrders() {
      const response = await fetch(API_BASE + '/api/admin/orders');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cannot load customer orders.');
      return data.orders || [];
    }

    const options = {
      chart: {
        id: 'sales-overview',
        type: 'area',
        height: 420,
        zoom: { enabled: false },
        toolbar: {
          show: false,
        },
      },
      colors: ['#E66239', '#198754'],
      stroke: { width: [3, 2.5], curve: 'smooth' },
      markers: { size: 4, hover: { sizeOffset: 2 } },
      series: [
        { name: 'This Year', data: salesThisYear },
        { name: 'Last Year', data: salesLastYear }
      ],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 60, 100]
        }
      },
      yaxis: {
        labels: { formatter: function (val) { return formatCurrency(val); } },
        title: { text: 'Sales (USD)' }
      },
      xaxis: {
        categories: months,
        tickPlacement: 'on'
      },
      tooltip: {
        shared: true,
        y: {
          formatter: function(val) { return formatCurrency(val); }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 340 },
            legend: { position: 'bottom', horizontalAlign: 'center' }
          }
        }
      ]
    };

    // mount chart
    const chart = new ApexCharts(document.querySelector("#salesChart"), options);
    chart.render();

    // helper: format currency with thousands separators (assumes INR — change locale/currency as needed)
    function formatCurrency(value) {
      if (value == null) return '-';
      const n = Number(value);
      return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }

    function updateSalesOverview() {
      chart.updateSeries([
        { name: 'This Year', data: salesThisYear },
        { name: 'Last Year', data: salesLastYear }
      ]);
    }

    document.getElementById('btn-random').addEventListener('click', () => {
      loadReportOrders().then(orders => {
        monthlySales(orders);
        updateSalesOverview();
      }).catch(error => {
        console.warn(error.message);
      });
    });

    // Example control: Toggle to show only This Year
    let showingBoth = true;
    document.getElementById('btn-update').addEventListener('click', () => {
      if (showingBoth) {
        chart.updateSeries([{ name: 'This Year', data: salesThisYear }]);
        document.getElementById('btn-update').textContent = 'Show Comparison';
      } else {
        chart.updateSeries([
          { name: 'This Year', data: salesThisYear },
          { name: 'Last Year', data: salesLastYear }
        ]);
        document.getElementById('btn-update').textContent = 'Show This Year Only';
      }
      showingBoth = !showingBoth;
    });

    loadReportOrders().then(orders => {
      monthlySales(orders);
      updateSalesOverview();
    }).catch(error => {
      console.warn(error.message);
    });
  }
});
