import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-plugin-dragdata";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function GrowthChart({curve, growthHandler}) {

  const chartRef = useRef(null);

  function fixDataset(dataset, point, value) {
    const updatedDataset = [...dataset]; // Copy the dataset to avoid mutating the original
    updatedDataset[point] = value; // Update the value at the specified index
  
    const sum = updatedDataset.reduce((a, b) => a + b, 0); // Calculate the current sum
    let adjustment = 100 - sum; // Determine how much adjustment is needed
  
    // Adjust other elements
    let i = 0;
    while (adjustment !== 0) {
      if (i === point) {
        // Skip the updated index
        i = (i + 1) % updatedDataset.length;
        continue;
      }
  
      if (adjustment > 0 && updatedDataset[i] < 50) {
        updatedDataset[i]++; // Increment the value if below max
        adjustment--;
      } else if (adjustment < 0 && updatedDataset[i] > 0) {
        updatedDataset[i]--; // Decrement the value if above min
        adjustment++;
      }
  
      i = (i + 1) % updatedDataset.length; // Move to the next index
    }
  
    return updatedDataset;
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      backgroundColor: 'transparent', // Ensure the chart layout uses transparency
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Growth Projection Curve (Drag to Edit)",
        font: {
          size: 20, // Larger font size
          weight: "bold", // Bold text
        },
        color: "#fff", // Label for Y axis
      },
      dragData: {
        round: 0, // Ensure this is set to 0 (handled by dragDataModifier instead)
        dragDataModifier: (value) => {
          // Snap to nearest multiple of 5
          const snappedValue = Math.round(value / 5) * 5;
          console.log(`Dragging snapped to: ${snappedValue}`);
          return Math.min(Math.max(snappedValue, 0), 100); // Clamp to range [0, 100]
        },
        onDrag: (e, datasetIndex, index, value) => {
          // console.log(
          //   `Dragging point ${index} in dataset ${datasetIndex} to value ${value}`
          // );
        },
        onDragEnd: (e, datasetIndex, point, value) => {
          const chartInstance = chartRef.current;
          chartInstance.data.datasets[datasetIndex].data = fixDataset(chartInstance.data.datasets[datasetIndex].data, point, value);

          chartInstance.update(); // Trigger chart re-render

          growthHandler(chartInstance.data.datasets[datasetIndex].data);
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const { dataset, dataIndex } = tooltipItem;
            return `Growth: ${dataset.data[dataIndex]}%`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0, // Start of range
        max: 50, // End of range
        ticks: {
          stepSize: 10, // Main increments of 10
          color: "#fff"
        },
        grid: {
          drawTicks: true,
          tickLength: 10,
          color: "#fff"
        },
        title: {
          display: true,
          text: "Growth %",
          font: {
            size: 16, // Larger font size
            weight: "bold", // Bold text
          },
          color: "#fff", // Label for Y axis
        },
      },
      x: {
        type: "linear", // For numerical x-axis
        offset: true, // Offset the x labels
        ticks: {
          stepSize: 1, // Increment x-axis by 1
          color: "#fff"
        },
        title: {
          display: true,
          text: "Year",
          font: {
            size: 16, // Larger font size
            weight: "bold", // Bold text
          },
          color: "#fff", // Label for X axis
        },
      },
    },
  };

  const data = {
    labels: [2025, 2026, 2027, 2028, 2029], // X-axis points
    datasets: [
      {
        label: "Dataset",
        data: curve, // Initial Y-axis values
        borderColor: "#B7A8FD", // Set the line color to purple
        borderWidth: 4,
        pointRadius: 10,
        pointBackgroundColor: "#B7A8FD",
        pointHoverRadius: 12,
        pointHoverBackgroundColor: "#B7A8FD",
        draggable: true, // Enables drag
      },
    ],
  };

  return <Line ref={chartRef} options={options} data={data} />;
}
