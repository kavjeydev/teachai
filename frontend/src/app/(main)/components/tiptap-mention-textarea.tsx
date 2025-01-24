import { IconBrandPython, IconBrandReact } from "@tabler/icons-react";
import { useQuery } from "convex/react";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface MentionListProps {
  items: { filename: string; fileId: string }[];
  command: (item: { id: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const chatId = window.location.href.split("/").slice(-1)[0] as Id<"chats">;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentContext = useQuery(api.chats.getContext, { id: chatId });
  props.items = currentContext || [];

  const selectItem = (index: any) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item.filename });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length,
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));
  /* Dropdown menu */

  return (
    <div
      className="flex flex-col gap-0.5 bg-white dark:bg-black border-1 border-[#dddddd] dark:border-[#222222] rounded-lg shadow-md
    p-2 max-h-[200px] overflow-scroll"
    >
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className="flex items-center bg-transparent gap-1 text-left w-full p-2 rounded-lg hover:bg-gray-100 focus:bg-gray-200
            dark:hover:bg-default-100 dark:focus:bg-default-200"
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="flex gap-2 items-center">
              <IconBrandPython stroke={1} className="h-4 w-4" />
              {item.filename}
            </div>
          </button>
        ))
      ) : (
        <div className="item">No result</div>
      )}
    </div>
  );
});
