chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'taskWarning') {
    chrome.notifications.create('task-warning', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Task Time Almost Up!',
      message: '5 minutes remaining for your current task',
      priority: 2
    });
  }
});
