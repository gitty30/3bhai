// Scrape all relevant profile data from the Twitter profile page
function scrapeProfileData() {
    // Username from URL
    const url = window.location.href;
    const match = url.match(/x\.com\/([A-Za-z0-9_]+)/);
    const username = match ? match[1] : '';

    // Verified badge
    const verified = !!document.querySelector('[data-testid="icon-verified"]');

    // Followers count
    let followers = '';
    const spans = Array.from(document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3'));
    for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const parent = span.parentElement;
        if (!parent) continue;
        const nextSpan = parent.nextElementSibling;
        if (nextSpan && nextSpan.textContent.trim() === 'Followers') {
            followers = span.textContent.trim();
            break;
        }
        if (parent && parent.children.length === 2 && parent.children[1].textContent.trim() === 'Followers') {
            followers = parent.children[0].textContent.trim();
            break;
        }
    }

    // Join date
    let joinDate = '';
    const joinSpan = document.querySelector('span[data-testid="UserJoinDate"]');
    if (joinSpan) {
        joinDate = joinSpan.textContent.replace('Joined', '').trim();
    }

    // Send all data to background for this tab
    chrome.runtime.sendMessage({
        action: "profileData",
        data: { username, verified, followers, joinDate }
    });

    // Store the last data for popup requests
    window.__lastProfileData = { username, verified, followers, joinDate };
}

// Observe DOM changes for real-time updates
const observer = new MutationObserver(scrapeProfileData);
observer.observe(document.body, { childList: true, subtree: true });

// Initial scrape
scrapeProfileData();

// Respond to popup requests for latest data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "get_profile_data") {
        sendResponse(window.__lastProfileData || {});
    }
});