document.addEventListener('DOMContentLoaded', async function () {
    // Load data
    const [TWbord_town, LEsmoothed] = await Promise.all([
        fetch('data/TWbord_town.geojson').then(response => response.json()),
        fetch('data/LEsmoothed.json').then(response => response.json())
    ]);

    const yearSlider = document.getElementById('yearSlider');
    const sliderWrapper = yearSlider.parentNode; // Get the slider-wrapper
    const playPauseButton = document.getElementById('playPauseButton');
    const resetButton = document.getElementById('resetButton');

    let animationInterval;
    let isPlaying = false;

    // Slider year display variables and elements
    const sliderMinYear = parseInt(yearSlider.min);
    const sliderMaxYear = parseInt(yearSlider.max);
    


    // Dynamically create tick marks and year labels for ALL years
    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'slider-ticks';
    sliderWrapper.appendChild(ticksContainer);

    for (let year = sliderMinYear; year <= sliderMaxYear; year++) {
        const tickMark = document.createElement('div');
        tickMark.className = 'tick-mark';
        ticksContainer.appendChild(tickMark);

        const tickLabel = document.createElement('span');
        tickLabel.className = 'tick-label';
        tickLabel.textContent = year; // Display year for every tick
        tickMark.appendChild(tickLabel);
    }

    // Dynamically create current year display bubble
    const currentYearDisplay = document.createElement('div');
    currentYearDisplay.className = 'slider-current-year-display';
    sliderWrapper.appendChild(currentYearDisplay);

    // Color Stop for Mean Maps
    const colorStopsMean = [
        [0.0, '#9F353A'], [0.1, '#B50D18'], [0.2, '#D3422F'], [0.3, '#FB9966'], [0.4, '#FFBA84'], [0.5, '#F4E496'],
        [0.6, '#E0EAA9'], [0.7, '#B2D494'], [0.8, '#8DC191'], [0.9, '#4D9595'], [1.0, '#26659C']
    ];

    // Highcharts instances (will be initialized and updated)
    let maleMeanChart = null;
    let femaleMeanChart = null;
    let maleSDChart = null;
    let femaleSDChart = null;

    // Top/Bottom 10 bar charts (Initialized once)
    const top10MaleChart = Highcharts.chart('LEtop10_male', {
        chart: { type: 'bar' },
        title: {
            text: 'Top 10 Male Life Expectancy',
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
        },
        xAxis: { categories: [], title: { text: null } },
        yAxis: { min: 75, max: 86, title: { text: 'Life Expectancy', align: 'high' } },
        plotOptions: { bar: { dataLabels: { enabled: true, format: '{point.y:.3f}' } } },
        series: [{ name: 'Male Life Expectancy', data: [], color: '#fca24d' }]
    });

    const bottom10MaleChart = Highcharts.chart('LEbottom10_male', {
        chart: { type: 'bar' },
        title: {
            text: 'Bottom 10 Male Life Expectancy',
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
        },
        xAxis: { categories: [], title: { text: null } },
        yAxis: { min: 55, max: 70, title: { text: 'Life Expectancy', align: 'high' } },
        plotOptions: { bar: { dataLabels: { enabled: true, format: '{point.y:.3f}' } },
         tooltip: { pointFormat: '<b>{point.name}</b><br><b>LE at birth:</b> {point.y:.3f}<br><b>SD:</b> {point.e0_sd:.3f}' }
        },
        series: [{ name: 'Male Life Expectancy', data: [], color: '#1f4e79' }]
    });

    const top10FemaleChart = Highcharts.chart('LEtop10_female', {
        chart: { type: 'bar' },
        title: {
            text: 'Top 10 Female Life Expectancy',
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
        },
        xAxis: { categories: [], title: { text: null } },
        yAxis: { min: 80, max: 92, title: { text: 'Life Expectancy', align: 'high' } },
        plotOptions: { bar: { dataLabels: { enabled: true, format: '{point.y:.3f}' } },
         tooltip: { pointFormat: '<b>{point.name}</b><br><b>LE at birth:</b> {point.y:.3f}<br><b>SD:</b> {point.e0_sd:.3f}' }
        },
        series: [{ name: 'Female Life Expectancy', data: [], color: '#fca24d' }]
    });

    const bottom10FemaleChart = Highcharts.chart('LEbottom10_female', {
        chart: { type: 'bar' },
        title: {
            text: 'Bottom 10 Female Life Expectancy',
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
        },
        xAxis: { categories: [], title: { text: null } },
        yAxis: { min: 65, max: 80, title: { text: 'Life Expectancy', align: 'high' } },
        plotOptions: { bar: { dataLabels: { enabled: true, format: '{point.y:.3f}' } },
         tooltip: { pointFormat: '<b>{point.name}</b><br><b>LE at birth:</b> {point.y:.3f}<br><b>SD:</b> {point.e0_sd:.3f}' }
        },
        series: [{ name: 'Female Life Expectancy', data: [], color: '#1f4e79' }]
    });


    // Play animation function
    function playAnimation() {
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
        animationInterval = setInterval(() => {
            let currentYear = parseInt(yearSlider.value);
            if (currentYear < sliderMaxYear) {
                yearSlider.value = currentYear + 1;
                updateCharts(currentYear + 1);
                updateCurrentYearDisplay();
            } else {
                pauseAnimation();
            }
        }, 1000);
    }

    // Pause animation function
    function pauseAnimation() {
        isPlaying = false;
        playPauseButton.textContent = 'Play';
        clearInterval(animationInterval);
    }

    // Update all charts function
    function updateCharts(year) {
        const maleDataCurrentYear = LEsmoothed.filter(d => d.YEAR === year && d.SEX === 1);
        const femaleDataCurrentYear = LEsmoothed.filter(d => d.YEAR === year && d.SEX === 2);

        // Prepare data for maps
        const maleMeanData = maleDataCurrentYear.map(d => ({ MOI: d.MOI, value: d.e0_mean, name: d.County_Township_ZH }));
        const femaleMeanData = femaleDataCurrentYear.map(d => ({ MOI: d.MOI, value: d.e0_mean, name: d.County_Township_ZH }));
        const maleSDData = maleDataCurrentYear.map(d => ({ MOI: d.MOI, value: d.e0_sd, name: d.County_Township_ZH }));
        const femaleSDData = femaleDataCurrentYear.map(d => ({ MOI: d.MOI, value: d.e0_sd, name: d.County_Township_ZH }));

        // Destroy old chart instances before creating new ones to prevent memory leaks
        if (maleMeanChart) maleMeanChart.destroy();
        if (femaleMeanChart) femaleMeanChart.destroy();
        if (maleSDChart) maleSDChart.destroy();
        if (femaleSDChart) femaleSDChart.destroy();

        // Create/Update Mapping Charts
        maleMeanChart = Highcharts.mapChart('LEmeanMap_male', {
            chart: { map: TWbord_town },
            title: {
                text: `Male Life Expectancy (${year})`,
                style: { fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
            },
            colorAxis: { min: 55, max: 90, stops: colorStopsMean, naColor: '#808080' },
            series: [{
                data: maleMeanData,
                joinBy: 'MOI',
                name: 'LE at birth (Male)',
                borderColor: '#808080',
                borderWidth: 0.3,
                tooltip: { pointFormat: '<b>{point.name}</b><br><b>LE at birth:</b> {point.value:.3f}<br>' }
            }]
        });

        femaleMeanChart = Highcharts.mapChart('LEmeanMap_female', {
            chart: { map: TWbord_town },
            title: {
                text: `Female Life Expectancy (${year})`,
                style: { fontFamily: 'Outfit', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
            },
            colorAxis: { min: 55, max: 90, stops: colorStopsMean, naColor: '#808080' },
            series: [{
                data: femaleMeanData,
                joinBy: 'MOI',
                name: 'LE at birth (Female)',
                borderColor: '#808080',
                borderWidth: 0.3,
                tooltip: { pointFormat: '<b>{point.name}</b><br><b>LE at birth:</b> {point.value:.3f}<br>' }
            }]
        });

        maleSDChart = Highcharts.mapChart('LEsdMap_male', {
            chart: { map: TWbord_town },
            title: {
                text: `Male Life Expectancy Standard Deviation (${year})`,
                style: { fontFamily: 'Outfit', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
            },
            colorAxis: {
                min: 0,
                max: 7.5,
                stops: [
                    [0.0, '#FFFFFF'], 
                    [1.0, '#fc4d50'] 
                ],
                naColor: '#808080'
            },
            series: [{
                data: maleSDData,
                joinBy: 'MOI',
                name: 'Standard deviation of LE at birth (Male)',
                borderColor: '#808080',
                borderWidth: 0.3,
                tooltip: { pointFormat: '<b>{point.name}</b><br><b>SD of LE at birth:</b> {point.value:.3f}<br>' }
            }]
        });

        femaleSDChart = Highcharts.mapChart('LEsdMap_female', {
            chart: { map: TWbord_town },
            title: {
                text: `Female Life Expectancy Standard Deviation (${year})`,
                style: { fontFamily: 'Outfit', fontSize: '15px', color: '#333333', fontWeight: 'normal' }
            },
            colorAxis: {
                min: 0,
                max: 7.5,
                stops: [
                    [0.0, '#FFFFFF'], 
                    [1.0, '#fc4d50'] 
                ],
                naColor: '#808080'
            },
            series: [{
                data: femaleSDData,
                joinBy: 'MOI',
                name: 'Standard deviation of LE at birth (Female)',
                borderColor: '#808080',
                borderWidth: 0.3,
                tooltip: { pointFormat: '<b>{point.name}</b><br><b>SD of LE at birth:</b> {point.value:.3f}<br>' }
            }]
        });

        // Update Top/Bottom 10 bar charts
        const maleTop10 = [...maleDataCurrentYear].sort((a, b) => b.e0_mean - a.e0_mean).slice(0, 10);
        top10MaleChart.series[0].update({
            data: maleTop10.map(d => ({ name: d.County_Township_ZH, y: d.e0_mean, e0_sd: d.e0_sd })),
            name: `Male Life Expectancy (${year})`
        }, false);
        top10MaleChart.xAxis[0].setCategories(maleTop10.map(d => d.County_Township_ZH), false);

        const maleBottom10 = [...maleDataCurrentYear].sort((a, b) => a.e0_mean - b.e0_mean).slice(0, 10);
        bottom10MaleChart.series[0].update({
            data: maleBottom10.map(d => ({ name: d.County_Township_ZH, y: d.e0_mean, e0_sd: d.e0_sd })),
            name: `Male Life Expectancy (${year})`
        }, false);
        bottom10MaleChart.xAxis[0].setCategories(maleBottom10.map(d => d.County_Township_ZH), false);

        const femaleTop10 = [...femaleDataCurrentYear].sort((a, b) => b.e0_mean - a.e0_mean).slice(0, 10);
        top10FemaleChart.series[0].update({
            data: femaleTop10.map(d => ({ name: d.County_Township_ZH, y: d.e0_mean, e0_sd: d.e0_sd })),
            name: `Female Life Expectancy (${year})`
        }, false);
        top10FemaleChart.xAxis[0].setCategories(femaleTop10.map(d => d.County_Township_ZH), false);

        const femaleBottom10 = [...femaleDataCurrentYear].sort((a, b) => a.e0_mean - b.e0_mean).slice(0, 10);
        bottom10FemaleChart.series[0].update({
            data: femaleBottom10.map(d => ({ name: d.County_Township_ZH, y: d.e0_mean, e0_sd: d.e0_sd })),
            name: `Female Life Expectancy (${year})`
        }, false);
        bottom10FemaleChart.xAxis[0].setCategories(femaleBottom10.map(d => d.County_Township_ZH), false);

        // Batch redraw for bar charts
        top10MaleChart.redraw();
        bottom10MaleChart.redraw();
        top10FemaleChart.redraw();
        bottom10FemaleChart.redraw();
    }

    // == Update position and content of current year display on thumb ==
    function updateCurrentYearDisplay() {
        const value = parseInt(yearSlider.value);
        const min = parseInt(yearSlider.min);
        const max = parseInt(yearSlider.max);
        const range = max - min; // Total range of years

        const sliderWidth = yearSlider.offsetWidth; // Total width of the slider input element
        const thumbSize = parseFloat(getComputedStyle(yearSlider).getPropertyValue('--thumb-size'));

        const effectiveTrackWidth = sliderWidth - thumbSize;
        
        const percentage = (value - min) / range;

        const thumbCenterPosition = percentage * effectiveTrackWidth + (thumbSize / 2);
        currentYearDisplay.style.left = `${thumbCenterPosition}px`;
        currentYearDisplay.textContent = value;
    }

    // Event listener: When slider value changes
    yearSlider.addEventListener('input', (event) => {
        if (isPlaying) {
            pauseAnimation();
        }
        updateCharts(parseInt(event.target.value));
        updateCurrentYearDisplay();
    });

    // Event listener: Play/Pause button
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pauseAnimation();
        } else {
            if (parseInt(yearSlider.value) === sliderMaxYear) {
                yearSlider.value = sliderMinYear; // Reset to start if at max
                updateCharts(sliderMinYear);
            }
            playAnimation();
        }
        updateCurrentYearDisplay();
    });

    // Event listener: Reset button
    resetButton.addEventListener('click', () => {
        pauseAnimation();
        yearSlider.value = sliderMinYear;
        updateCharts(sliderMinYear);
        updateCurrentYearDisplay();
    });

    // === Tab navigation JavaScript logic ===
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function showTab(tabId) {
        tabButtons.forEach(button => button.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        tabContents.forEach(content => content.style.display = 'none'); // Ensure content is hidden

        const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block'; // Make content visible
            // When tab content changes, force Highcharts to reflow to fit the new visible area
            if (tabId === 'meanMapsSection') {
                if (maleMeanChart) maleMeanChart.reflow();
                if (femaleMeanChart) femaleMeanChart.reflow();
            } else if (tabId === 'sdMapsSection') {
                if (maleSDChart) maleSDChart.reflow();
                if (femaleSDChart) femaleSDChart.reflow();
            } else if (tabId === 'topBottomSection') {
                if (top10MaleChart) top10MaleChart.reflow();
                if (bottom10MaleChart) bottom10MaleChart.reflow();
                if (top10FemaleChart) top10FemaleChart.reflow();
                if (bottom10FemaleChart) bottom10FemaleChart.reflow();
            }
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // Initial load:
    updateCharts(parseInt(yearSlider.value));
    updateCurrentYearDisplay();
    showTab('meanMapsSection'); // Show default tab

    // Listen for window resize to adjust year display position
    window.addEventListener('resize', updateCurrentYearDisplay);
});