document.addEventListener('DOMContentLoaded', () => {
    const appList = document.getElementById('app-list');
    const activityLog = document.getElementById('activity-log');
    const searchInput = document.getElementById('app-search');

    searchInput.addEventListener('input', () => filterApps(appList, searchInput.value));

    window.appMonitor.onUpdateApps(apps => updateAppList(appList, apps, searchInput.value));
    window.appMonitor.onAppsStarted(apps => logStartedApps(activityLog, apps));
    window.appMonitor.onAppsClosed(pids => logClosedApps(activityLog, pids));
});

function updateAppList(appList, apps, searchTerm) {
    appList.innerHTML = '';
    searchTerm = searchTerm.toLowerCase();

    apps.filter(app => app.name.toLowerCase().includes(searchTerm))
        .forEach(app => {
            const div = document.createElement('div');
            div.className = 'app-item';
            div.innerHTML = `
                <span class="app-name">${app.name.replace('.exe', '')}</span>
                <span class="app-info">PID: ${app.pid}</span>
                <span class="app-info">Memory: ${app.memoryUsage}</span>
            `;
            appList.appendChild(div);
        });

    if (appList.children.length === 0) {
        const div = document.createElement('div');
        div.className = 'no-apps';
        div.textContent = 'No running applications found';
        appList.appendChild(div);
    }
}

function logStartedApps(activityLog, apps) {
    apps.forEach(app => addLogEntry(activityLog, `Started: ${app.name.replace('.exe', '')}`, 'start'));
}

function logClosedApps(activityLog, pids) {
    pids.forEach(pid => addLogEntry(activityLog, `Closed: PID ${pid}`, 'stop'));
}

function addLogEntry(activityLog, message, type) {
    const entry = document.createElement('div');
    entry.className = `log-item ${type}`;
    entry.innerHTML = `
        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        <span class="message">${message}</span>
    `;
    activityLog.insertBefore(entry, activityLog.firstChild);

    // Keep only last 50 entries
    while (activityLog.children.length > 50) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

function filterApps(appList, searchTerm) {
    const apps = appList.getElementsByClassName('app-item');
    Array.from(apps).forEach(app => {
        const name = app.querySelector('.app-name').textContent.toLowerCase();
        app.style.display = name.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}
