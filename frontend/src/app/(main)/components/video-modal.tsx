import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import { ArrowRight } from "lucide-react";
import { Button } from "@nextui-org/button";

export default function VideoModal() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        onClick={onOpen}
        variant="faded"
        className="hover:bg-white text-black dark:hover:bg-black dark:text-white"
      >
        Watch a demo <span className="mt-[1px] text-lg">➤</span>
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="!fixed z-[999999]" // Set z-index higher than navbar
        backdrop="blur"
        size="5xl"
      >
        <ModalContent className="!relative z-[9999999]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Trainly Demo
              </ModalHeader>
              <ModalBody>
                <video width="1750" height="1500" controls>
                  <source src="/trainly_demo.mp4" type="video/mp4" />
                </video>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="faded" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
