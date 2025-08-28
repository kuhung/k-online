document.addEventListener('DOMContentLoaded', () => {
    const updateTimeElement = document.getElementById('update-time');
    const upsideProbElement = document.getElementById('upside-prob');
    const volAmpProbElement = document.getElementById('vol-amp-prob');
    const chartImgElement = document.getElementById('prediction-chart-img');

    const fetchPredictionData = async () => {
        try {
            // const response = await fetch('/api/prediction_service'); 
            const response = await fetch('/public/latest_prediction.json');
            const data = await response.json();

            if (response.ok) {
                updateTimeElement.textContent = data.updated_at_utc;
                upsideProbElement.textContent = data.upside_probability;
                volAmpProbElement.textContent = data.volatility_amplification_probability;
                chartImgElement.src = `data:image/png;base64,${data.chart_image_base64}`;
            } else {
                console.error('Error fetching prediction data:', data.error || 'Unknown error');
                // Optionally display an error message on the page
                updateTimeElement.textContent = 'Error';
                upsideProbElement.textContent = 'Error';
                volAmpProbElement.textContent = 'Error';
            }
        } catch (error) {
            console.error('Network or parsing error:', error);
            // Optionally display an error message on the page
            updateTimeElement.textContent = 'Error';
            upsideProbElement.textContent = 'Error';
            volAmpProbElement.textContent = 'Error';
        }
    };

    // Fetch data immediately on page load
    fetchPredictionData();

    // Optionally, refresh data periodically
    // setInterval(fetchPredictionData, 3600000); // Refresh every hour (3600000 ms)
});
