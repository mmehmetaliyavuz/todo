
// App.jsx
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Pencil, Copy } from "lucide-react";

const supabaseUrl = "https://sdzrvflxoyuitpcrskyh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkenJ2Zmx4b3l1aXRwY3Jza3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYxMDgsImV4cCI6MjA2MDY0MjEwOH0.VU1tTwk4grjVTLDn1tG3MLBxOsH23SVw7vBxNj1DWmM";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [listId, setListId] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.signInAnonymously();
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
    };
    initAuth();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let currentListId = urlParams.get("list");
    if (!currentListId) {
      currentListId = uuidv4();
      urlParams.set("list", currentListId);
      window.history.replaceState({}, "", `${window.location.pathname}?${urlParams}`);
    }
    setListId(currentListId);
  }, []);

  useEffect(() => {
    if (listId) fetchTasks();
  }, [listId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, text, completed")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const addOrUpdateTask = async () => {
    if (!newTask.trim()) return;
    if (editTaskId) {
      await supabase.from("tasks").update({ text: newTask }).eq("id", editTaskId);
      setEditTaskId(null);
    } else {
      await supabase.from("tasks").insert([
        { text: newTask.trim(), completed: false, list_id: listId },
      ]);
    }
    setNewTask("");
    fetchTasks();
  };

  const toggleTask = async (id, currentStatus) => {
    await supabase.from("tasks").update({ completed: !currentStatus }).eq("id", id);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    fetchTasks();
  };

  const createNewList = () => {
    const newId = uuidv4();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("list", newId);
    window.location.search = urlParams.toString();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Bağlantı panoya kopyalandı!");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4 p-4">
      <h1 className="text-2xl font-bold">📝 Görev Listem</h1>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500 truncate">Liste ID: {listId}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLink} className="text-sm flex items-center gap-1">
            <Copy size={16} /> Paylaş
          </Button>
          <Button variant="outline" onClick={createNewList} className="text-sm">
            Yeni Liste Oluştur
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Görev gir..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOrUpdateTask()}
        />
        <Button onClick={addOrUpdateTask}>{editTaskId ? "Güncelle" : "Ekle"}</Button>
      </div>

      {tasks.length === 0 && <p className="text-gray-500">Henüz görev yok.</p>}

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="flex items-center gap-3 p-3 justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id, task.completed)}
              />
              <CardContent className={task.completed ? "line-through text-gray-400" : ""}>
                {task.text}
              </CardContent>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => {
                setNewTask(task.text);
                setEditTaskId(task.id);
              }}>
                <Pencil size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
