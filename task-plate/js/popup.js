document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const taskInput = document.getElementById('task-input');
  const timeInput = document.getElementById('time-input');
  const addTaskBtn = document.getElementById('add-task');
  const taskList = document.getElementById('task-list');
  const totalTimeDisplay = document.getElementById('total-time');
  const plateSvg = document.getElementById('factory-plate');
  
  // State
  let tasks = [];
  
  // Color generator - creates distinct colors
  function generateColor(index, total) {
    const hue = (index * (360 / total)) % 360;
    const saturation = 80 + Math.random() * 20;
    const lightness = 50 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  // Initialize
  loadTasks();
  
  // Event Listeners
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  timeInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  
  // Functions
  function loadTasks() {
    chrome.storage.sync.get(['tasks'], (result) => {
      if (result.tasks) {
        tasks = result.tasks;
        renderTasks();
        updatePlate();
      }
    });
  }
  
  function addTask() {
    const name = taskInput.value.trim();
    const time = parseFloat(timeInput.value);
    
    if (!name || isNaN(time) || time <= 0) {
      alert('Please enter valid task details');
      return;
    }
    
    const newTask = {
      id: Date.now(),
      name: name.toUpperCase(),
      time,
      color: generateColor(tasks.length, tasks.length + 1)
    };
    
    // Animation: Button click effect
    addTaskBtn.classList.add('clicked');
    setTimeout(() => addTaskBtn.classList.remove('clicked'), 300);
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updatePlate();
    
    // Reset inputs with animation
    taskInput.style.transform = 'translateX(-5px)';
    timeInput.style.transform = 'translateX(-5px)';
    setTimeout(() => {
      taskInput.style.transform = 'translateX(0)';
      timeInput.style.transform = 'translateX(0)';
      taskInput.value = '';
      timeInput.value = '';
      taskInput.focus();
    }, 200);
  }
  
  function deleteTask(id) {
    // Animation: Fade out task
    const taskEl = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskEl) {
      taskEl.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updatePlate();
      }, 300);
    }
  }
  
  function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newName = prompt('Edit task name:', task.name) || task.name;
    const newTime = parseFloat(prompt('Edit time (hours):', task.time));
    
    if (isNaN(newTime) || newTime <= 0) {
      alert('Invalid time value');
      return;
    }
    
    // Animation: Pulse effect on edit
    const taskEl = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskEl) {
      taskEl.style.animation = 'pulse 0.5s ease-out';
      setTimeout(() => taskEl.style.animation = '', 500);
    }
    
    task.name = newName.toUpperCase();
    task.time = newTime;
    saveTasks();
    renderTasks();
    updatePlate();
  }
  
  function saveTasks() {
    chrome.storage.sync.set({ tasks });
  }
  
  function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      taskList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;text-transform:uppercase;letter-spacing:1px;animation:fadeIn 0.5s ease-out">No tasks added</p>';
      return;
    }
    
    const totalTime = tasks.reduce((sum, task) => sum + task.time, 0);
    totalTimeDisplay.textContent = totalTime.toFixed(1);
    
    if (totalTime > 7) {
      totalTimeDisplay.style.color = 'var(--red)';
      const warning = document.createElement('p');
      warning.className = 'warning';
      warning.textContent = `Over limit by ${(totalTime - 7).toFixed(1)}h`;
      taskList.appendChild(warning);
    } else {
      totalTimeDisplay.style.color = 'var(--white)';
    }
    
    tasks.forEach((task, index) => {
      const taskEl = document.createElement('div');
      taskEl.className = 'task-item';
      taskEl.dataset.id = task.id;
      taskEl.style.borderLeftColor = task.color;
      taskEl.style.animationDelay = `${index * 0.1}s`;
      
      const colorIndicator = document.createElement('span');
      colorIndicator.className = 'color-indicator';
      colorIndicator.style.backgroundColor = task.color;
      
      taskEl.innerHTML = `
        <div class="task-info">
          <div class="task-name">${colorIndicator.outerHTML}${task.name}</div>
          <div class="task-time">${task.time}h</div>
        </div>
        <div class="task-actions">
          <button data-id="${task.id}" class="edit-btn">Edit</button>
          <button data-id="${task.id}" class="delete-btn">Delete</button>
        </div>
      `;
      
      taskList.appendChild(taskEl);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteTask(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => editTask(parseInt(btn.dataset.id)));
    });
  }
  
  function updatePlate() {
    // Clear existing plate segments
    const existingSegments = plateSvg.querySelectorAll('.plate-segment');
    existingSegments.forEach(seg => {
      seg.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => seg.remove(), 300);
    });
    
    const totalTime = tasks.reduce((sum, task) => sum + task.time, 0);
    
    if (tasks.length === 0) {
      const text = plateSvg.querySelector('.plate-empty-text');
      if (!text) {
        const newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        newText.setAttribute('x', '140');
        newText.setAttribute('y', '140');
        newText.setAttribute('text-anchor', 'middle');
        newText.setAttribute('class', 'plate-empty-text');
        newText.textContent = 'ADD TASKS';
        plateSvg.appendChild(newText);
      }
      return;
    }
    
    // Remove empty text if present
    const emptyText = plateSvg.querySelector('.plate-empty-text');
    if (emptyText) {
      emptyText.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => emptyText.remove(), 300);
    }
    
    // Draw new segments with distinct colors
    let startAngle = 0;
    const centerX = 140;
    const centerY = 140;
    const radius = 130;
    
    tasks.forEach((task, index) => {
      const portionAngle = (task.time / totalTime) * 360;
      const endAngle = startAngle + portionAngle;
      
      // Convert angles to radians
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      // Calculate start and end points
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      // Create path for the segment
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'plate-segment');
      path.setAttribute('d', `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${portionAngle > 180 ? 1 : 0} 1 ${x2} ${y2}
        Z
      `);
      path.setAttribute('fill', task.color);
      path.setAttribute('stroke', 'var(--black)');
      path.setAttribute('stroke-width', '1');
      path.style.animationDelay = `${index * 0.1}s`;
      
      // Add tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${task.name}: ${task.time}h`;
      path.appendChild(title);
      
      plateSvg.appendChild(path);
      
      startAngle = endAngle;
    });
  }
  
  // Add CSS for fadeOut animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      to { opacity: 0; transform: translateX(20px); }
    }
  `;
  document.head.appendChild(style);
});
