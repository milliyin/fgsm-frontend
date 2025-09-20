"use client";
import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  // Todo state
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  
  // FGSM Demo state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [epsilon, setEpsilon] = useState<number>(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'todos' | 'fgsm'>('todos');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Todo functions
  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  // FGSM Demo functions
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function runAttack() {
    if (!file) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('epsilon', String(epsilon));

      const res = await fetch(`${API_BASE}/attack`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }

      const payload = await res.json();
      const advB64 = payload.adversarial_image_base64;
      const advUrl = advB64 ? `data:image/png;base64,${advB64}` : null;

      setResult({
        original: payload.original_prediction,
        adversarial: payload.adversarial_prediction,
        success: payload.attack_success,
        advUrl,
      });
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-3 text-gray-800 tracking-tight">
          Multi-Tool Dashboard
        </h1>
        <p className="text-base text-gray-500 mb-8 leading-relaxed">
          Manage your todos and run ML adversarial attacks in one place.
        </p>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('todos')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'todos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todo List
          </button>
          <button
            onClick={() => setActiveTab('fgsm')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'fgsm'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            FGSM Demo
          </button>
        </div>

        {/* Todo Tab Content */}
        {activeTab === 'todos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">My Todos</h2>
              <button
                onClick={createTodo}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                + New Todo
              </button>
            </div>
            
            {todos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No todos yet</p>
                <p className="text-sm">Create your first todo to get started!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-gray-800">{todo.content}</span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                🥳 App successfully hosted with AWS Amplify!{' '}
                <a
                  href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/"
                  className="underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Review next steps of this tutorial.
                </a>
              </p>
            </div>
          </div>
        )}

        {/* FGSM Demo Tab Content */}
        {activeTab === 'fgsm' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">FGSM Attack Demo - MNIST</h2>
              <p className="text-gray-600">
                Upload a handwritten-digit-like image, choose epsilon, and run the FGSM attack against MNIST.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* File Upload */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Image (PNG / JPEG)</label>
                <input
                  ref={fileInputRef}
                  onChange={onFileChange}
                  type="file"
                  accept="image/png, image/jpeg"
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {previewUrl ? (
                  <div className="mt-3 border rounded-xl p-2 w-44 h-44 flex items-center justify-center bg-gray-50 shadow-sm">
                    <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-400 italic">No image selected</div>
                )}
              </div>

              {/* Epsilon */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Epsilon</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={epsilon}
                  onChange={(e) => setEpsilon(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={epsilon}
                    onChange={(e) => {
                      let v = Number(e.target.value);
                      if (isNaN(v)) v = 0;
                      if (v < 0) v = 0;
                      if (v > 1) v = 1;
                      setEpsilon(v);
                    }}
                    className="w-24 rounded-md px-2 py-1 border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={reset}
                    className="ml-auto text-sm text-indigo-600 hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={runAttack}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-60"
                  >
                    {loading ? "Running attack..." : "Run FGSM Attack"}
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                Error: {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Results</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Original */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">Original</div>
                    <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-28 bg-white flex items-center justify-center border rounded-lg shadow">
                          {previewUrl ? (
                            <img src={previewUrl} alt="original" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <div className="text-xs text-gray-400">No preview</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm">Class: <span className="font-medium">{result.original?.class ?? "—"}</span></div>
                          <div className="text-sm">Index: <span className="font-medium">{result.original?.class_index ?? "—"}</span></div>
                          <div className="text-sm">Confidence: <span className="font-medium">{(result.original?.confidence ?? 0).toFixed(4)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adversarial */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">Adversarial</div>
                    <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-28 bg-white flex items-center justify-center border rounded-lg shadow">
                          {result.advUrl ? (
                            <img src={result.advUrl} alt="adversarial" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <div className="text-xs text-gray-400">No adversarial image returned</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm">Class: <span className="font-medium">{result.adversarial?.class ?? "—"}</span></div>
                          <div className="text-sm">Index: <span className="font-medium">{result.adversarial?.class_index ?? "—"}</span></div>
                          <div className="text-sm">Confidence: <span className="font-medium">{(result.adversarial?.confidence ?? 0).toFixed(4)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attack result */}
                  <div className="md:w-48 md:flex-shrink-0">
                    <div className="text-sm text-gray-600 mb-2">Attack</div>
                    <div className="border rounded-xl p-4 bg-gray-50 text-center shadow-sm">
                      <div className="text-sm">Success:</div>
                      <div className={`mt-2 text-xl font-bold ${result.success ? "text-green-600" : "text-red-600"}`}>
                        {String(result.success)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side by side */}
                <div className="mt-8">
                  <h4 className="text-sm text-gray-600 mb-3">Side-by-side Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3 bg-white flex items-center justify-center shadow-sm">
                      {previewUrl ? (
                        <img src={previewUrl} className="max-h-48" alt="orig large" />
                      ) : (
                        <span className="text-sm text-gray-400">No original</span>
                      )}
                    </div>
                    <div className="border rounded-lg p-3 bg-white flex items-center justify-center shadow-sm">
                      {result.advUrl ? (
                        <img src={result.advUrl} className="max-h-48" alt="adv large" />
                      ) : (
                        <span className="text-sm text-gray-400">No adversarial</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
