"use client"; // only needed if you use Next.js with the app router
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";

// 1. Create a list of mentionable items (for demonstration)
const USERS = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Charlie" },
];

// 2. Define the suggestion configuration for the Mention extension
const suggestion = {
  char: "@",
  // Called whenever the user types after the '@'
  // Return the matching items
  items: (query: any) => {
    return USERS.filter((item) => {
      return item.name.toLowerCase().startsWith(query.toLowerCase());
    });
  },
  // Define how the items are displayed in the suggestion list
  render: () => {
    let component: any;
    let popup;

    return {
      onStart: (props: any) => {
        component = document.createElement("div");
        component.className = "mention-dropdown";
        update(props);

        document.body.appendChild(component);
      },
      onUpdate: (props: any) => {
        update(props);
      },
      onKeyDown: (props: any) => {
        if (props.event.key === "Escape") {
          props.event.preventDefault();
          props.command("hide");
          return true;
        }
        return false;
      },
      onExit: () => {
        if (component) {
          document.body.removeChild(component);
        }
      },
    };

    function update(props: any) {
      const { items, command } = props;

      // Simple inline styling for the dropdown. Adjust to your preference.
      component.style.position = "absolute";
      component.style.top =
        (props.clientRect?.top ?? 0) + window.scrollY + 30 + "px";
      component.style.left = (props.clientRect?.left ?? 0) + "px";
      component.style.background = "#fff";
      component.style.border = "1px solid #ccc";
      component.style.padding = "4px";
      component.style.borderRadius = "4px";
      component.style.zIndex = "9999";

      component.innerHTML = ""; // clear previous suggestions

      items.forEach((item: any) => {
        const div = document.createElement("div");
        div.className = "mention-item";
        div.style.padding = "4px 8px";
        div.style.cursor = "pointer";
        div.textContent = item.name;

        div.addEventListener("mousedown", (e) => {
          e.preventDefault();
          command({ id: item.id, label: item.name });
        });

        component.appendChild(div);
      });
    }
  },
};

// 3. Configure the Mention extension
const mentionExtension = Mention.configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion,
});

// 4. Initialize the editor
export default function MentionEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      mentionExtension, // Add your mention extension
    ],
    content: "",
  });

  return (
    <div>
      <h2>Tiptap Editor with @mentions</h2>
      {/* The actual editable area: */}
      <EditorContent editor={editor} contentEditable />

      {/* Optional: A place to see the raw JSON or HTML for debugging */}
      {/* <div style={{ marginTop: "1rem", fontFamily: "monospace" }}>
        <strong>Editor Content (JSON):</strong>
        <pre>{JSON.stringify(editor?.getJSON(), null, 2)}</pre>
      </div> */}
    </div>
  );
}
