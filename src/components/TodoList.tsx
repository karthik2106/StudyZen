import { useState } from "react";
import { CheckSquare, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Review CS101 lecture notes", completed: false },
    { id: "2", text: "Complete data structures assignment", completed: false },
    { id: "3", text: "Study for algorithms midterm", completed: true },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
      };
      setTodos([todo, ...todos]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, text: editText.trim() } : todo
        )
      );
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div className="bg-glass backdrop-blur-sm border border-glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">To-Do List</h2>
      </div>

      {/* Add new todo */}
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, addTodo)}
          className="flex-1 bg-secondary/50 border-border focus:border-primary"
        />
        <Button
          onClick={addTodo}
          className="bg-primary hover:bg-primary/90"
          size="icon"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Todo list */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-secondary/50 rounded-xl p-3 border border-border hover:border-primary/30 transition-all duration-200 ${
                todo.completed ? "opacity-60" : ""
              }`}
            >
              {editingId === todo.id ? (
                // Edit mode
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, () => saveEdit(todo.id))}
                    className="flex-1 bg-background border-primary"
                    autoFocus
                  />
                  <Button
                    onClick={() => saveEdit(todo.id)}
                    size="icon"
                    variant="ghost"
                    className="text-success hover:text-success hover:bg-success/10"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                // View mode
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 ${
                      todo.completed
                        ? "bg-primary border-primary"
                        : "border-muted-foreground hover:border-primary"
                    }`}
                  >
                    {todo.completed && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-foreground ${
                      todo.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.text}
                  </span>
                  <Button
                    onClick={() => startEdit(todo.id, todo.text)}
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-accent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteTodo(todo.id)}
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {todos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {todos.filter((t) => !t.completed).length} task
            {todos.filter((t) => !t.completed).length !== 1 ? "s" : ""} remaining
          </span>
          <span>
            {todos.filter((t) => t.completed).length} completed
          </span>
        </div>
      )}
    </div>
  );
};

export default TodoList;
