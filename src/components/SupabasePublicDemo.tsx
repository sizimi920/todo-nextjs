"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Todo = {
  id: string;
  title: string | null;
  isCompleted: boolean;
  created_at: string | null;
};

export default function SupabasePublicDemo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初期データの取得
    fetchTodos();

    // リアルタイム更新のセットアップ
    let channel = supabase.channel('db-changes');

    // INSERT
    channel = channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'todos',
      },
      (payload) => {
        console.log('INSERT event payload:', payload);
        fetchTodos();
      }
    );
    // DELETE
    channel = channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'todos',
      },
      (payload) => {
        console.log('DELETE event payload:', payload);
        fetchTodos();
      }
    );
    // UPDATE
    channel = channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'todos',
      },
      (payload) => {
        console.log('UPDATE event payload:', payload);
        const updatedTodo = payload.new as Todo;
        setTodos((currentTodos) =>
          currentTodos.map((todo) =>
            todo.id === updatedTodo.id ? updatedTodo : todo
          )
        );
      }
    );

    // チャンネルをサブスクライブ
    channel.subscribe(async (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to changes');
      }
    });

    // クリーンアップ関数
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTodos() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("todos")
      .select("id, title, isCompleted, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    setLoading(false);
    if (error) setError(error.message);
    else setTodos(data ?? []);
  }

  async function addTodo() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from("todos")
        .insert([{ 
          title: trimmedTitle,
          isCompleted: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      // 成功した場合のみタイトルをクリア
      setTitle("");
      
    } catch (err) {
      console.error("Error adding todo:", err);
      setError(err instanceof Error ? err.message : "タスクの追加に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTodo(id: string, currentValue: boolean) {
    setError(null);
    
    try {
      const { error } = await supabase
        .from("todos")
        .update({ isCompleted: !currentValue })
        .eq("id", id);

      if (error) throw error;
      
      // 操作が成功した場合、ローカルの状態も更新
      setTodos(currentTodos => 
        currentTodos.map(todo => 
          todo.id === id 
            ? { ...todo, isCompleted: !currentValue }
            : todo
        )
      );
      
    } catch (err) {
      console.error("Error toggling todo:", err);
      const errorMessage = err instanceof Error ? err.message : "タスクの更新に失敗しました";
      console.error("Detailed error:", errorMessage);
      setError(errorMessage);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm("このタスクを削除してもよろしいですか？")) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
    } catch (err) {
      console.error("Error deleting todo:", err);
      setError(err instanceof Error ? err.message : "タスクの削除に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Todoリスト
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {todos.length} 件のタスク
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <input
                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent
                transition-all duration-200 shadow-sm hover:shadow-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="新しいタスク"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addTodo();
                  }
                }}
              />
            </div>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
              text-white font-medium rounded-xl shadow-md hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
              transition-all duration-200 ease-in-out
              focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800/50" 
              onClick={addTodo} 
              disabled={loading}
            >
              追加
            </button>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50/50 dark:bg-red-900/30 backdrop-blur-sm 
              text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div>
            {loading && (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 dark:border-blue-900"></div>
                  <div className="absolute top-0 left-0 h-12 w-12 border-t-2 border-blue-600 dark:border-blue-400 rounded-full"></div>
                </div>
              </div>
            )}
            {!loading && todos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="text-gray-400 dark:text-gray-500 font-medium">タスクはまだありません</div>
                <div className="text-sm text-gray-400 dark:text-gray-600 mt-1">新しいタスクを追加してみましょう</div>
              </div>
            )}
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`group rounded-xl border backdrop-blur-sm shadow-sm hover:shadow-md
                  ${todo.isCompleted 
                    ? 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50' 
                    : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-700/50'
                  }
                  transition-all duration-200 ease-in-out`}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() => toggleTodo(todo.id, todo.isCompleted)}
                        className="h-5 w-5 rounded-lg border-2 border-gray-300 dark:border-gray-600
                        text-gradient-to-r from-blue-600 to-purple-600
                        focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50
                        checked:border-blue-500 dark:checked:border-blue-400
                        transition-all duration-200"
                      />
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div 
                          className={`text-base break-words ${
                            todo.isCompleted 
                              ? 'text-gray-400 dark:text-gray-500 line-through' 
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {todo.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {todo.created_at
                            ? new Date(todo.created_at).toLocaleString("ja-JP", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "-"}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-2 text-gray-400 hover:text-red-500 
                        focus:opacity-100 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="タスクを削除"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
