let todoForm = document.querySelector("form");
let todoInput = document.getElementById("todo-input");
let todoListUL = document.getElementById("todo-list");

let isDragging = false;
let currentY;
let initialY;
let currentElement = null;
let yOffset = 0;

let allTodos = getTodos();
updateTodoList();

// Form submission event listener
todoForm.addEventListener("submit", function(event) {
  event.preventDefault();
  addTodo();
});

// Document-level drag event listeners
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', dragEnd);

function addTodo() {
    let todoText = todoInput.value.trim();
    if (todoText.length > 0) {
        let todoObject = {
            text: todoText,
            completed: false
        }
        // Add new todo at the beginning of the array
        allTodos.unshift(todoObject);
        updateTodoList();
        saveTodos();
        todoInput.value = "";
    }
}

function createTodoItem(todo, todoIndex) {
    let todoId = "todo-" + todoIndex;
    let todoListItem = document.createElement("li");
    let todoText = todo.text;
    todoListItem.className = "todo";
    todoListItem.innerHTML = `<input type="checkbox" id="${todoId}" />
        <label class="custom-checkbox" for="${todoId}">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
            >
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
            </svg>
        </label>
        <label for="${todoId}" class="todo-text"> ${todoText} </label>
        <button class="delete-button">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
            >
                <path
                    d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
                />
            </svg>
        </button>
        <button class="drag-handle">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="#606060"
            >
                <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"/>
            </svg>
        </button>`;

    let deleteButton = todoListItem.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => {
        deleteTodoItem(todoIndex);
    });

    let checkbox = todoListItem.querySelector("input");
    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;  // Update the completed state in the todo object
  
      // Move the todo item to the end of the list if completed
      if (todo.completed) {
          allTodos = allTodos.filter(t => t !== todo); // Remove the todo from its current position
          allTodos.push(todo); // Add it to the end
      } else {
          // If it's not completed, ensure it stays in the same order
          allTodos = allTodos.filter(t => t !== todo); // Remove the todo from its current position
          allTodos.unshift(todo); // Add it back to the beginning
      }
  
      // Save the updated todos and update the list
      saveTodos();
      updateTodoList(); // Update the list to reflect changes
  });

    checkbox.checked = todo.completed; // Ensure checkbox reflects the current state

    // Add drag event listeners to the drag handle only
    let dragHandle = todoListItem.querySelector('.drag-handle');
    dragHandle.addEventListener('mousedown', dragStart);
    dragHandle.addEventListener('touchstart', dragStart, { passive: true });

    return todoListItem;
}

function dragStart(e) {
    // Only allow dragging if the drag handle is clicked
    if (!e.target.closest('.drag-handle')) {
        return;
    }

    if (e.type === 'mousedown') {
        initialY = e.clientY;
    } else {
        initialY = e.touches[0].clientY;
    }

    currentElement = e.target.closest('.todo');
    if (currentElement) {
        isDragging = true;
        currentElement.classList.add('dragging');
    }
}

function drag(e) {
    if (!isDragging || !currentElement) return;
    
    e.preventDefault();

    if (e.type === 'mousemove') {
        currentY = e.clientY;
    } else {
        currentY = e.touches[0].clientY;
    }

    yOffset = currentY - initialY;
    
    // Get all todo items
    const todos = Array.from(document.querySelectorAll('.todo:not(.dragging)'));
    
    // Find the element we're dragging over
    const nextElement = todos.find(todo => {
        const box = todo.getBoundingClientRect();
        const midPoint = box.top + box.height / 2;
        return currentY < midPoint;
    });

    const todoList = document.getElementById('todo-list');
    
    if (nextElement) {
        todoList.insertBefore(currentElement, nextElement);
    } else {
        todoList.appendChild(currentElement);
    }
    
    initialY = currentY;
}

function dragEnd() {
    if (!isDragging || !currentElement) return;
    
    isDragging = false;
    currentElement.classList.remove('dragging');
    
    // Update the todos array to match the new DOM order
    const newTodos = [];
    document.querySelectorAll('.todo').forEach((todoElement) => {
        const todoId = todoElement.querySelector('input[type="checkbox"]').id;
        const index = parseInt(todoId.split('-')[1]);
        newTodos.push(allTodos[index]);
    });
    
    allTodos = newTodos;
    saveTodos();
    updateTodoList();
    
    currentElement = null;
    yOffset = 0;
}

function updateTodoList() {
    todoListUL.innerHTML = "";

    // Sort todos: uncompleted first, then completed
    const sortedTodos = allTodos.slice().sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    sortedTodos.forEach((todo, todoIndex) => {
        const todoItem = createTodoItem(todo, todoIndex);
        todoListUL.append(todoItem);
    });
}

function deleteTodoItem(todoIndex) {
    allTodos.splice(todoIndex, 1); // Remove the todo from the array
    saveTodos();
    updateTodoList();
}

function saveTodos() {
    let todosJson = JSON.stringify(allTodos);
    localStorage.setItem("todos", todosJson);
}

function getTodos() {
  let todos = localStorage.getItem("todos") || "[]";
  try {
      return JSON.parse(todos);
  } catch (e) {
      console.error("Error parsing todos from localStorage", e);
      return [];
  }
}
