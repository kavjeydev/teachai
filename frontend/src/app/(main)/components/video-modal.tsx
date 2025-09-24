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
        className="hover:bg-amber-400/10 hover:text-black border-1 dark:text-white text-black
         font-darkerGrotesque font-medium bg-[#f9f9f9] dark:bg-[#222222]"
      >
        <h1 className="mb-0.5">
          WATCH A DEMO <span className="mt-[2px] text-md">➤</span>
        </h1>
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
