"use client";

import { useState, useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
  autocompletion,
  startCompletion,
  CompletionContext,
} from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";

const powerRangersData = {
  tableName: "power_rangers",
  data: [
    {
      id: 1,
      user: "Jason Lee Scott",
      ranger_color: "Red",
      zord: "Tyrannosaurus",
      weapon: "Power Sword",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 90,
      location: "Angel Grove",
    },
    {
      id: 2,
      user: "Trini Kwan",
      ranger_color: "Yellow",
      zord: "Saber-Toothed Tiger",
      weapon: "Power Daggers",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 85,
      location: "Angel Grove",
    },
    {
      id: 3,
      user: "Billy Cranston",
      ranger_color: "Blue",
      zord: "Triceratops",
      weapon: "Power Lance",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 80,
      location: "Angel Grove",
    },
    {
      id: 4,
      user: "Kimberly Hart",
      ranger_color: "Pink",
      zord: "Pterodactyl",
      weapon: "Power Bow",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 88,
      location: "Angel Grove",
    },
    {
      id: 5,
      user: "Zack Taylor",
      ranger_color: "Black",
      zord: "Mastodon",
      weapon: "Power Axe",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 82,
      location: "Angel Grove",
    },
    {
      id: 6,
      user: "Tommy Oliver",
      ranger_color: "Green",
      zord: "Dragonzord",
      weapon: "Dragon Dagger",
      season: "Mighty Morphin",
      joined_date: "1993-10-10",
      status: "Active",
      power_level: 95,
      location: "Angel Grove",
    },
    {
      id: 7,
      user: "Tommy Oliver",
      ranger_color: "White",
      zord: "White Tigerzord",
      weapon: "Saba",
      season: "Mighty Morphin",
      joined_date: "1994-01-10",
      status: "Active",
      power_level: 97,
      location: "Angel Grove",
    },
  ],
  columns: [
    { name: "id", type: "integer", notNull: true },
    { name: "user", type: "text", notNull: true },
    { name: "ranger_color", type: "text", notNull: true },
    { name: "zord", type: "text", notNull: true },
    { name: "weapon", type: "text", notNull: true },
    { name: "season", type: "text", notNull: true },
    { name: "joined_date", type: "date", notNull: true },
    { name: "status", type: "text", notNull: true },
    { name: "power_level", type: "integer", notNull: true },
    { name: "location", type: "text", notNull: true },
  ],
};

export default function DatabaseEditor() {
  const editorRef = useRef<EditorView | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const runQuery = (view: EditorView): boolean => {
    const query = view.state.doc.toString().trim().toLowerCase();
    if (!query) {
      setResult("No query entered");
      return true;
    }

    const selectMatch = query.match(/^select\s+(.+?)\s+from\s+/i);
    const fromMatch = query.includes("from power_rangers");

    if (!selectMatch || !fromMatch) {
      setResult("Error: Query must be 'SELECT <fields> FROM power_rangers'");
      return true;
    }

    const rawFields = selectMatch[1].split(",").map((f) => f.trim());
    if (new Set(rawFields).size !== rawFields.length) {
      setResult("Error: Duplicate field names are not allowed");
      return true;
    }

    if (rawFields.includes("*") && rawFields.length > 1) {
      setResult("Error: Cannot mix * with specific fields");
      return true;
    }

    const fields = rawFields.includes("*")
      ? powerRangersData.columns.map((col) => col.name)
      : rawFields;
    const resultData = powerRangersData.data.map((row) =>
      Object.fromEntries(
        fields.map((field) => [field, row[field as keyof typeof row]])
      )
    );

    setResult(JSON.stringify(resultData, null, 2));
    return true;
  };

  useEffect(() => {
    const completion = (ctx: CompletionContext) => {
      const word = ctx.matchBefore(/[\w*]+/);
      if (!ctx.explicit && !word) return null;

      const docText = ctx.state.doc.toString().toLowerCase();
      const cursorPos = ctx.pos;

      // Already selected fields between SELECT and FROM
      const selectMatch = docText.match(/^select\s+(.+?)\s+from/i)?.[1];
      const alreadySelectedFields =
        selectMatch?.split(",").map((f) => f.trim().toLowerCase()) || [];

      // 1. Empty editor or just whitespace, suggest SELECT
      if (/^\s*$/.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [{ label: "SELECT", type: "keyword", apply: "SELECT " }],
        };
      }

      // 2. After SELECT, suggest * or columns (only if no fields selected yet)
      if (/^select\s*$/i.test(docText)) {
        const options = powerRangersData.columns.map((col) => ({
          label: col.name,
          type: "field",
          detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
          apply: col.name,
        }));
        options.unshift({
          label: "*",
          type: "field",
          detail: "all columns",
          apply: "*",
        });
        return {
          from: word?.from ?? cursorPos,
          options,
        };
      }

      // 3. After SELECT with fields or comma, suggest only remaining columns
      if (
        /^select\s+[\w\s,]+$/i.test(docText) &&
        /,\s*$/.test(docText) &&
        !docText.includes("from")
      ) {
        const options = powerRangersData.columns
          .filter((col) => !alreadySelectedFields.includes(col.name))
          .map((col) => ({
            label: col.name,
            type: "field",
            detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
            apply: `, ${col.name}`,
          }));
        return {
          from: word?.from ?? cursorPos,
          options,
        };
      }

      // 4. After SELECT * or valid fields, suggest FROM
      if (
        /^select\s+[\w\s*,]+\s*$/i.test(docText) &&
        !docText.includes("from") &&
        !/,\s*$/.test(docText)
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: [{ label: "FROM", type: "keyword", apply: " FROM " }],
        };
      }

      // 5. After FROM, suggest power_rangers table
      if (/from\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: powerRangersData.tableName,
              type: "table",
              apply: powerRangersData.tableName,
            },
          ],
        };
      }

      return null;
    };

    const state = EditorState.create({
      doc: "",
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        keymap.of([
          ...defaultKeymap,
          indentWithTab,
          { key: "Ctrl-Space", run: startCompletion },
          {
            key: "Mod-Enter",
            run: (view) => {
              runQuery(view);
              return true; // Indicate the event is handled
            },
            preventDefault: true, // Prevent default behavior (e.g., insertBlankLine)
          },
        ]),
        autocompletion({ override: [completion], activateOnTyping: false }),
      ],
    });

    const view = new EditorView({
      state,
      parent: document.getElementById("editor")!,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-white p-4 space-y-4 md:space-y-0 md:space-x-4 font-mono">
      <div className="w-full md:w-1/2">
        <div
          id="editor"
          className="h-[70vh] border border-slate-700 rounded-xl bg-[#1e293b] p-3 text-sm"
        />
        <button
          onClick={() => editorRef.current && runQuery(editorRef.current)}
          className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition"
        >
          ▶ Run Query
        </button>
      </div>
      <div className="w-full md:w-1/2 bg-[#1e293b] rounded-xl p-4 overflow-auto text-sm border border-slate-700">
        {result ? (
          <pre className="text-green-300 whitespace-pre-wrap">{result}</pre>
        ) : (
          <p className="text-slate-400">
            The results of your query will appear here.
          </p>
        )}
      </div>
    </div>
  );
}