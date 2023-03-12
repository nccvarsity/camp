import {
  Component,
  createResource,
  For,
  ErrorBoundary,
  onMount,
  createEffect,
  createSignal,
  onCleanup,
  Show,
  Switch,
  Match,
} from 'solid-js'
import type { AddSuggestion, LabelSuggestion, LikeSuggestion, Suggestions } from './utils/client';
import { createStore, produce } from 'solid-js/store'

import logo from './logo.svg';
import styles from './App.module.css';
import { supabase } from './utils/client';
import { RealtimeSubscription } from '@supabase/supabase-js';
import { BsHandThumbsUp, BsHandThumbsUpFill } from 'solid-icons/bs'
import { filter, words } from './utils/filter';


const loadSuggestions = async () => {
  const { data, error } = await supabase.from<Suggestions>('varsitycamp').select().eq('safe', true);
  return data;
}

const App: Component = () => {
  const [data, { mutate, refetch }] = createResource(loadSuggestions);
  const [password, setPassword] = createSignal<string>('')
  const [suggestions, setSuggestions] = createStore<Suggestions[]>([])
  const [inputSuggestion, setInputSuggestion] = createSignal<string>('')
  const [likedSet, setLikedSet] = createSignal(new Set());
  const [themes, setThemes] = createSignal(new Set<string>());
  const [displayTheme, setDisplayTheme] = createSignal<string>('all');
  const [refreshingThemes, setRefreshingThemes] = createSignal<boolean>(false);
  let subscription: RealtimeSubscription | null

  createEffect(() => {
    const returnedValue = data()
    if (returnedValue) {
      returnedValue.sort((a, b) => b.likes - a.likes);
      setSuggestions(returnedValue);
      returnedValue.forEach(item => {
        themes().add(item.theme);
      })
    }
  })

  createEffect(() => {
    if (suggestions) {
      suggestions.forEach(item => {
        themes().add(item.theme);
      })
    }
  })

  onMount(() => {
    filter.addWords(words);
    subscription = supabase
      .from<Suggestions>('varsitycamp')
      .on('*', (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            setSuggestions((prev) => [...prev, payload.new]);
            break
          case 'UPDATE':
            setSuggestions((item) => item.id === payload.new.id, payload.new);
            break
          case 'DELETE':
            setSuggestions((prev) => prev.filter((item) => item.id != payload.old.id));
            break
        }
      })
      .subscribe()
  })

  onCleanup(() => {
    subscription?.unsubscribe()
  })

  async function submitted() {
    if (!inputSuggestion()) return;
    let safe = false;
    if (!filter.exists(inputSuggestion())) {
      safe = true;
    } else {
      console.log(filter.censor(inputSuggestion()));
    }
    const { data, error } = await supabase.from<AddSuggestion>('varsitycamp').insert({
      suggestion: inputSuggestion(),
      safe: safe,
    })
    if (error) {
      console.error(error);
    }
    setInputSuggestion('');
  }

  async function liked(id: number, likes: number) {
    const { data, error } = await supabase.from<LikeSuggestion>('varsitycamp').update({
      likes: likes
    }).eq('id', id);
    if (error) {
      console.error(error);
    }
    setInputSuggestion('');
  }

  async function updateTheme(id: number, theme: string) {
    const { data, error } = await supabase.from<LabelSuggestion>('varsitycamp').update({
      theme: theme === "" ? "unlabelled" : theme
    }).eq('id', id);
    if (error) {
      console.error(error);
    }
    location.reload();
  }

  return (
    <div class={styles.App}>
      <div class="p-4 mx-auto max-w-md">
        <Show when={password() !== "vcamp23" && password() !== "grcamp23" }>
          <input
              class="border-4 my-8"
              type="password"
              value={password()}
              onKeyUp={(e) => {
                const target = e.target as HTMLInputElement;
                setPassword(target.value)
              }}
            />
            <h1>Enter code</h1>
        </Show>
        <Show when={password() === "vcamp23"}>
          <div class="mt-4">
            <h1 class="mb-2">What do you wanna talk about?</h1>
            <textarea
              style="margin-bottom: -12px"
              class="p-2"
              value={inputSuggestion()}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                setInputSuggestion(target.value)
              }}
            />
            <button onClick={submitted}>Submit</button>
          </div>
          <ErrorBoundary
            fallback={
              <div class="text-white bg-red-500">
                Something went terribly wrong <br></br> {data.error.message}{' '}
              </div>
            }
          >
            <div>
              <button value="all" onClick={() => {
                    setDisplayTheme("all");
                  }}>all</button>
              <For each={Array.from(themes())}>
                {(theme) => 
                  <button
                    value={theme}
                    onClick={() => {
                      setDisplayTheme(theme);
                  }}>{theme}</button>
                }
              </For>
            </div>
            <h1 class="mt-4">{displayTheme().toUpperCase()}</h1>
            <For each={suggestions}>
              {(item) => 
                <Switch fallback={
                  <>
                    <Show when={item.theme === displayTheme()}>
                      <div class="my-4 p-4 border-4">
                        <h2 class="my-1">{item.suggestion}</h2>
                        <div class="flex" style="justify-content: start; align-items: center;">
                          <span>theme:</span><input
                            class="w-1/2"
                            type="text"
                            value={item.theme}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              updateTheme(item.id, target.value);
                            }}
                          />
                          <BsHandThumbsUp size={20} style={{ display: "inline-block" }} onClick={() => {
                            if (!likedSet().has(item.id)) {
                              liked(item.id, (item.likes + 1));
                              likedSet().add(item.id);
                            } else {
                              liked(item.id, (item.likes - 1));
                              likedSet().delete(item.id);
                            }
                          }} /> <span style="display: inline-block"> {item.likes > 0 ? `+${item.likes}` : ""} </span>
                        </div>
                      </div>
                    </Show>
                  </>
                }>
                  <Match when={displayTheme() === "all"}>
                    <div class="my-4 p-4 border-4">
                      <h2 class="my-1">{item.suggestion}</h2>
                      <div class="flex" style="justify-content: start; align-items: center;">
                        <span>theme:</span><input
                          class="w-1/2"
                          type="text"
                          value={item.theme}
                          onChange={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateTheme(item.id, target.value);
                          }}
                        />
                        <BsHandThumbsUp size={20} style={{ display: "inline-block" }} onClick={() => {
                          if (!likedSet().has(item.id)) {
                            liked(item.id, (item.likes + 1));
                            likedSet().add(item.id);
                          } else {
                            liked(item.id, (item.likes - 1));
                            likedSet().delete(item.id);
                          }
                        }} /> <span style="display: inline-block"> {item.likes > 0 ? `+${item.likes}` : ""} </span>
                      </div>
                    </div>
                  </Match>
                </Switch>
              }
            </For>
          </ErrorBoundary>
        </Show>
      </div>
    </div>
  );
};

export default App;
