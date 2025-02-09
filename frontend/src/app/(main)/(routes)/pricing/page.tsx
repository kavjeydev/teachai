"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NextUIProvider } from "@nextui-org/react";
import { Card, CardHeader, CardBody } from "@nextui-org/react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import Navbar from "@/app/components/navbar";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <NextUIProvider className="dark:bg-darkdarkbg font-geist">
      <div className="flex flex-col dark:bg-darkdarkbg bg-lightlightbg items-center min-h-screen overscroll-contain">
        <Navbar />
        <div className="mt-24 flex flex-col gap-10 items-center w-full px-4">
          <div className="flex flex-col gap-0 max-w-3xl">
            <div
              className="flex flex-col gap-4 max-w-3xl text-md dark:text-maincolor text-third
            items-center font-normal"
            >
              Pricing
            </div>
            <div className="flex flex-col gap-3 max-w-3xl">
              <h1
                className="text-[2.5rem] font-spaceg leading-[1.1] tracking-tighter
              w-full text-center font-medium "
              >
                Get unlimited access.
              </h1>
              <h2 className="text-center text-lg text-muted-foreground font-normal">
                Explore our AI plans for your business growth and success.
              </h2>
            </div>
          </div>

          <div
            className="flex h-10 w-[19.5rem] rounded-full dark:bg-white/10 bg-[#DDDDDD]
          border dark:border-[#444444] border-[#BBBBBB] cursor-pointer mb-2"
          >
            <div
              className={cn(
                "flex dark:text-muted-foreground/80 text-[#555555] w-2/5 text-sm m-1 items-center justify-center rounded-full transition-all duration-300",
                !annual
                  ? "bg-white dark:bg-white/10 dark:text-white text-black"
                  : "hover:bg-[#BBBBBB] dark:hover:bg-[#444444]",
              )}
              onClick={() => {
                setAnnual(false);
              }}
            >
              Pay Monthly
            </div>
            <div
              className={cn(
                "flex dark:text-muted-foreground/80 text-[#555555] w-3/5 items-center justify-center m-1 rounded-full",
                annual
                  ? "bg-white dark:bg-white/10 dark:text-white text-black"
                  : "hover:bg-[#BBBBBB] dark:hover:bg-[#444444]",
              )}
              onClick={() => {
                setAnnual(true);
              }}
            >
              <div className="h-full w-full flex items-center justify-center gap-2 pr-3 text-sm font-geist">
                <Badge
                  className="dark:bg-maincolor/20 dark:text-blue-400
                text-third bg-third/15 font-normal pointer-events-none rounded-full"
                >
                  Save 33%
                </Badge>
                Pay Yearly
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {/* <div className="absolute mt-28 ml-40 h-80 w-56 bg-third/30 rounded-full rotate-45 blur-3xl dark:bg-maincolor/20"></div> */}
            {/* <div className="absolute mt-8 ml-[30rem] h-80 w-56 bg-third/30 rounded-full -rotate-45 blur-3xl dark:bg-maincolor/20"></div> */}
            <Card className="py-4 bg-white/50 dark:bg-darkbg/50 backdrop-blur-md w-[300px]">
              <CardHeader className="flex gap-2 pb-0 pt-1 px-6 flex-col items-start">
                <h1 className="font-medium text-2xl  ">Free</h1>
                <p className="text-muted-foreground text-md">
                  For starters and hobbyists that want to try out.
                </p>
                <Separator className="mt-4 bg-muted-foreground/40" />
              </CardHeader>
              <CardBody className="overflow-visible px-6 py-2">
                <h1
                  className="font-bold text-[2.5rem] text-transparent bg-clip-text
                bg-gradient-to-br from-black to-slate-400 dark:from-white dark:to-to-slate-600"
                >
                  Free
                </h1>
                <div className="flex flex-col gap-2 mt-7">
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      Up to 500MB of context
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      Publish functionality
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">50K tokens / month</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <X className="text-muted-foreground h-4 w-4" />
                    <p className="text-muted-foreground">API Access</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <X className="text-muted-foreground h-4 w-4" />
                    <p className="text-muted-foreground">
                      No premium AI models
                    </p>
                  </div>
                </div>
                <div
                  className=" flex items-center justify-center w-full mt-8 h-12 bg-third/15 text-third dark:bg-maincolor/10
                dark:text-blue-400 rounded-xl cursor-pointer"
                >
                  Continue with free
                </div>
              </CardBody>
            </Card>
            {/* <PricingCard /> */}
            <Card
              className="py-4 bg-white/50 dark:bg-darkbg/50 backdrop-blur-md w-[300px]
            border dark:border-maincolor border-third"
            >
              <CardHeader className="flex gap-2 pb-0 pt-1 px-6 flex-col items-start">
                <div className="flex justify-between w-full items-center">
                  <h1 className="font-medium text-2xl  ">Startup 🪄</h1>
                  <Badge
                    className="dark:bg-maincolor/20 dark:text-blue-400
                text-third bg-third/15 font-normal pointer-events-none rounded-full"
                  >
                    Most Popular
                  </Badge>
                </div>
                <p className="text-muted-foreground text-md">
                  For individuals and small teams looking to learn quickly.
                </p>
                <Separator className="mt-4 bg-muted-foreground/40" />
              </CardHeader>
              <CardBody className="overflow-visible px-6 py-2">
                <h1
                  className="font-bold text-[2.5rem] text-transparent bg-clip-text
                bg-gradient-to-br from-black to-slate-400 dark:from-white dark:to-to-slate-600"
                >
                  {annual ? (
                    <div>
                      $6{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        /per month
                      </span>
                    </div>
                  ) : (
                    <div>
                      $9{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        /per month
                      </span>
                    </div>
                  )}
                </h1>
                <div className="flex flex-col gap-2 mt-7">
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      1000 API Calls / month
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">API Access</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">2M tokens / month</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      Up to 2 GB in context
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <X className="text-muted-foreground h-4 w-4" />
                    <p className="text-muted-foreground ">Premium AI models</p>
                  </div>
                </div>

                <div
                  className=" flex items-center justify-center w-full mt-8 h-12 bg-third text-white dark:bg-maincolor
                rounded-xl cursor-pointer hover:bg-third/80 dark:hover:bg-maincolor/80 transition-all duration-200"
                >
                  Get started
                </div>
              </CardBody>
            </Card>
            {/* <PricingCard /> */}
            <Card className="py-4 bg-white/50 dark:bg-darkbg/50 backdrop-blur-md w-[300px]">
              <CardHeader className="flex gap-2 pb-0 pt-1 px-6 flex-col items-start">
                <h1 className="font-medium text-2xl  ">Pro 🚀</h1>
                <p className="text-muted-foreground text-md">
                  For large teams looking to increase throughput.
                </p>
                <Separator className="mt-4 bg-muted-foreground/40" />
              </CardHeader>
              <CardBody className="overflow-visible px-6 py-2">
                <h1
                  className="font-bold text-[2.5rem] text-transparent bg-clip-text
                bg-gradient-to-br from-black to-slate-400 dark:from-white dark:to-to-slate-600"
                >
                  {annual ? (
                    <div>
                      $66{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        /per month
                      </span>
                    </div>
                  ) : (
                    <div>
                      $99{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        /per month
                      </span>
                    </div>
                  )}
                </h1>
                <div className="flex flex-col gap-2 mt-7">
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      Everything in Startup
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">Unlimited API Calls</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">100M tokens / month</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">
                      o1 + Deepseek R1 Access
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Check className="dark:text-maincolor text-third h-4 w-4" />
                    <p className="text-muted-foreground">Unlimited context</p>
                  </div>
                </div>
                <div
                  className=" flex items-center justify-center w-full mt-8 h-12 bg-third/15 text-third dark:bg-maincolor/10
                dark:text-blue-400 rounded-xl cursor-pointer"
                >
                  Contact us
                </div>
              </CardBody>
            </Card>
          </div>
          <h1 className="mb-28 text-muted-foreground text-lg font-normal">
            Explore startup discounts.{" "}
            <span className="dark:text-white text-black underline underline-offset-4 cursor-pointer">
              Contact us
            </span>
          </h1>
        </div>
      </div>
    </NextUIProvider>
  );
}
