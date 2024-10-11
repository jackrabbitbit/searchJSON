document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');

    const jsonInput = document.getElementById('json-input');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const clearJsonButton = document.getElementById('clear-json-button');
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const currentTheme = localStorage.getItem('theme') || 'light'; // Default to light theme

    console.log('DOM elements retrieved:', { jsonInput, searchInput, searchButton, searchResults });

    let currentMatchIndex = -1;
    let totalMatches = 0;
    let lastSearchTerm = '';
    
    clearJsonButton.addEventListener('click', clearJsonInput);
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    jsonInput.addEventListener('paste', (e) => {
        console.log('Paste event detected on jsonInput');
        setTimeout(formatJSON, 0);
    });


    function clearJsonInput() {
        console.log('Clearing JSON input');
        jsonInput.value = '';
        clearHighlights();
        searchResults.innerHTML = '';
        totalMatches = 0;
        currentMatchIndex = -1;
        lastSearchTerm = '';
    }
    async function handleSearch() {
        const currentSearchTerm = searchInput.value.trim();
        console.log('Current search term:', currentSearchTerm);
        console.log('Last search term:', lastSearchTerm);

        if (currentSearchTerm === '') {
            console.log('Empty search term, clearing results and highlights');
            clearHighlights();
            searchResults.innerHTML = '';
            totalMatches = 0;
            currentMatchIndex = -1;
            lastSearchTerm = '';
            return;
        }

        if (currentSearchTerm !== lastSearchTerm) {
            console.log('Search term changed, performing new search');
            clearHighlights();
            if (await searchJSON()) {
                console.log('New search completed, calling scrollToMatch');
                scrollToMatch();
            }
            lastSearchTerm = currentSearchTerm;
        } else {
            console.log('Search term unchanged, scrolling to next match');
            scrollToMatch();
        }
    }

    function formatJSON() {
        console.log('formatJSON function called');
        const data = jsonInput.value;
        fetch('/format_json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({data: data})
        })
        .then(response => response.json())
        .then(result => {
            if (result.formatted) {
                jsonInput.value = result.formatted;
            } else if (result.error) {
                console.error(`Error formatting JSON: ${result.error}`);
            }
        })
        .catch(error => {
            console.error('Error in formatJSON:', error);
        });
    }

    function clearHighlights() {
        console.log('Clearing highlights');
        const highlightedJson = document.getElementById('highlighted-json');
        if (highlightedJson) {
            highlightedJson.innerHTML = highlightedJson.innerHTML.replace(/<\/?mark[^>]*>/g, '');
            highlightedJson.style.display = 'none';
        }
        jsonInput.style.display = 'block';
    }

    async function searchJSON() {
        console.log('searchJSON function called');
        const data = jsonInput.value;
        const searchTerm = searchInput.value.trim();
        console.log('Search data:', { data, searchTerm });

        if (searchTerm === '') {
            console.log('Empty search term, aborting search');
            clearHighlights();
            searchResults.innerHTML = '';
            totalMatches = 0;
            currentMatchIndex = -1;
            return false;
        }

        try {
            const response = await fetch('/search_json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({data, search_term: searchTerm})
            });
            console.log('Search JSON response received');
            const result = await response.json();
            console.log('Search JSON result:', result);
            if (result.results && result.results.length > 0) {
                console.log('Calling displaySearchResults with:', result.results);
                displaySearchResults(result.results);
                console.log('Calling highlightMatches with:', result.matches);
                highlightMatches(result.matches);
                totalMatches = result.matches.length;
                currentMatchIndex = -1;
                console.log('Total matches found:', totalMatches);
                console.log('Current match index reset to:', currentMatchIndex);
                return true;
            } else {
                console.log('No matches found');
                searchResults.innerHTML = "No matches found";
                clearHighlights();
                totalMatches = 0;
                currentMatchIndex = -1;
                return false;
            }
        } catch (error) {
            console.error('Error in searchJSON:', error);
            searchResults.innerHTML = `Error: ${error}`;
            clearHighlights();
            return false;
        }
    }

    function highlightMatches(matches) {
        console.log('highlightMatches function called with matches:', matches);
        let highlightedText = jsonInput.value;
        let matchIndex = 0;
        
        matches.forEach(match => {
            console.log('Processing match:', match);
            const regex = new RegExp(escapeRegExp(match.value), 'g');
            highlightedText = highlightedText.replace(regex, (matchText) => 
                `<mark id="match-${matchIndex++}">${matchText}</mark>`
            );
        });
    
        let highlightedJsonElement = document.getElementById('highlighted-json');
        if (!highlightedJsonElement) {
            console.log('Creating new highlighted JSON element');
            highlightedJsonElement = document.createElement('div');
            highlightedJsonElement.id = 'highlighted-json';
            jsonInput.parentNode.insertBefore(highlightedJsonElement, jsonInput.nextSibling);
        }
    
        highlightedJsonElement.innerHTML = highlightedText;
        highlightedJsonElement.style.whiteSpace = 'pre-wrap';
        highlightedJsonElement.style.fontFamily = 'monospace';
        highlightedJsonElement.style.overflowX = 'auto';
        highlightedJsonElement.style.display = 'block';
        jsonInput.style.display = 'none';
        console.log('Highlighted JSON element updated');
    }

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function displaySearchResults(results) {
        console.log('displaySearchResults called with:', results);
        searchResults.innerHTML = '';
        
        results.forEach(result => {
            console.log('Processing result:', result);
            const resultDiv = document.createElement('div');
            resultDiv.className = 'search-result';
            
            const copyIcon = document.createElement('i');
            copyIcon.className = 'fas fa-copy copy-icon';
            copyIcon.addEventListener('click', () => copyToClipboard(result.path || result));
            resultDiv.appendChild(copyIcon);
            
            const pathSpan = document.createElement('span');
            pathSpan.textContent = result.path || result;
            resultDiv.appendChild(pathSpan);
            
            searchResults.appendChild(resultDiv);
        });
        console.log('Search results display completed');
    }
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => console.log('Text copied to clipboard'))
            .catch(err => console.error('Failed to copy: ', err));
    };

    function scrollToMatch() {
        console.log('scrollToMatch function called');
        const highlightedJson = document.getElementById('highlighted-json');
        console.log('Highlighted JSON element:', highlightedJson);
    
        if (highlightedJson) {
            const matches = highlightedJson.getElementsByTagName('mark');
            console.log('Total matches found:', matches.length);
            console.log('Current match index before increment:', currentMatchIndex);
    
            if (matches.length > 0) {
                currentMatchIndex = (currentMatchIndex + 1) % matches.length;
                console.log('Scrolling to match', currentMatchIndex + 1, 'of', matches.length);
    
                const targetMatch = document.getElementById(`match-${currentMatchIndex}`);
                console.log('Target match element:', targetMatch);
    
                if (targetMatch) {
                    targetMatch.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
                    
                    Array.from(matches).forEach(match => match.style.backgroundColor = '');
                    targetMatch.style.backgroundColor = '#FFFF00';
    
                    console.log('Scrolled to match:', targetMatch);
                } else {
                    console.log('Target match not found');
                }
            } else {
                console.log('No matches found in scrollToMatch');
            }
        } else {
            console.log('highlighted-json element not found');
        }
    }

    // Function to set theme
    function setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.style.setProperty('--bg-color', 'var(--light-bg-color)');
            document.documentElement.style.setProperty('--surface-color', 'var(--light-surface-color)');
            document.documentElement.style.setProperty('--primary-color', 'var(--light-primary-color)');
            document.documentElement.style.setProperty('--accent-color', 'var(--light-accent-color)');
            document.documentElement.style.setProperty('--text-color', 'var(--light-text-color)');
            document.documentElement.style.setProperty('--shadow-color', 'var(--light-shadow-color)');
            document.documentElement.style.setProperty('--glow-color', 'var(--light-glow-color)');
            document.body.classList.add('light-theme');
            toggleSwitch.checked = false;
        } else {
            document.documentElement.style.setProperty('--bg-color', 'var(--dark-bg-color)');
            document.documentElement.style.setProperty('--surface-color', 'var(--dark-surface-color)');
            document.documentElement.style.setProperty('--primary-color', 'var(--dark-primary-color)');
            document.documentElement.style.setProperty('--accent-color', 'var(--dark-accent-color)');
            document.documentElement.style.setProperty('--text-color', 'var(--dark-text-color)');
            document.documentElement.style.setProperty('--shadow-color', 'var(--dark-shadow-color)');
            document.documentElement.style.setProperty('--glow-color', 'var(--dark-glow-color)');
            document.body.classList.remove('light-theme');
            toggleSwitch.checked = true;
        }
    }

    setTheme(currentTheme);

    function switchTheme(e) {
        const theme = e.target.checked ? 'dark' : 'light';
        setTheme(theme);
        localStorage.setItem('theme', theme);
    }

    toggleSwitch.addEventListener('change', switchTheme, false);

    console.log('All event listeners and functions set up');
});