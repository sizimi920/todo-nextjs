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
    <div className="min-h-[calc(100vh-8rem)] py-6">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    タスク管理
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    リアルタイム同期対応のTodoアプリケーション
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todos.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    総タスク数
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {todos.filter(todo => todo.isCompleted).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    完了済み
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                新しいタスクを追加
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 
                    bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white 
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400
                    transition-all duration-200 text-base"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 買い物リストを作成する"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addTodo();
                      }
                    }}
                  />
                  {title.trim() && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 rounded">
                        Enter
                      </kbd>
                    </div>
                  )}
                </div>
                <button 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                  text-white font-medium rounded-2xl shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                  transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95
                  focus:ring-4 focus:ring-blue-500/20 min-w-[80px]" 
                  onClick={addTodo} 
                  disabled={loading || !title.trim()}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    "追加"
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
                    <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-red-800 dark:text-red-300 text-sm font-medium">
                    {error}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {loading && todos.length === 0 && (
                <div className="flex justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700"></div>
                    <div className="absolute top-0 left-0 h-12 w-12 border-t-4 border-blue-600 dark:border-blue-400 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
              
              {!loading && todos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    タスクがありません
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    上の入力フィールドを使って、最初のタスクを追加してみましょう
                  </p>
                </div>
              )}
              
              {todos.length > 0 && (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`group relative rounded-2xl border-2 transition-all duration-300 ease-in-out
                      ${todo.isCompleted 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-75' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg'
                      }`}
                    >
                      <div className="p-5 flex items-start gap-4">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={todo.isCompleted}
                            onChange={() => toggleTodo(todo.id, todo.isCompleted)}
                            className="h-5 w-5 rounded-lg border-2 border-gray-300 dark:border-gray-500
                            text-blue-600 focus:ring-2 focus:ring-blue-500/20 
                            checked:bg-blue-600 checked:border-blue-600
                            transition-all duration-200 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`text-base font-medium break-words transition-all duration-300 ${
                              todo.isCompleted 
                                ? 'text-gray-500 dark:text-gray-400 line-through' 
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {todo.title}
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {todo.created_at
                              ? new Date(todo.created_at).toLocaleString("ja-JP", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "不明"}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 
                          hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl
                          focus:opacity-100 focus:ring-2 focus:ring-red-500/20 
                          transition-all duration-200"
                          aria-label="タスクを削除"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {todo.isCompleted && (
                          <div className="absolute top-3 right-3">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
