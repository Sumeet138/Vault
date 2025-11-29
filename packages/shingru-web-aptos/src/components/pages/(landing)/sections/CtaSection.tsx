"use client";

import HugeCloudImage from "@/assets/images/huge-cloud.png";
import { Marquee } from "@/components/magicui/Marquee";
import Image from "next/image";
import Link from "next/link";

const publicAddresses = [
  { id: 1, address: "0x9A12...C3dA" },
  { id: 2, address: "0x4B08...D2dB" },
  { id: 3, address: "0x7F45...B1eC" },
  { id: 4, address: "0x2E8D...F9gH" },
  { id: 5, address: "0x5H67...K3lM" },
  { id: 6, address: "0x8G9h...L4nM" },
];

const paymentLinks = [
  {
    id: 1,
    name: "jordan",
    role: "digital strategist",
    tag: "Support Fund",
    emoji: "😊",
    bgColor: "bg-blue-200/60",
  },
  {
    id: 2,
    name: "casey",
    role: "marketing specialist",
    tag: "Project",
    emoji: "🚀",
    bgColor: "bg-purple-200/60",
  },
  {
    id: 3,
    name: "jamie",
    role: "creative consultant",
    tag: "Emergency Fund",
    emoji: "🎨",
    bgColor: "bg-pink-200/60",
  },
  {
    id: 4,
    name: "alex",
    role: "software engineer",
    tag: "Project",
    emoji: "💻",
    bgColor: "bg-yellow-200/60",
  },
  {
    id: 5,
    name: "taylor",
    role: "product manager",
    tag: "Support Fund",
    emoji: "📈",
    bgColor: "bg-teal-200/60",
  },
  {
    id: 6,
    name: "morgan",
    role: "UX designer",
    tag: "Emergency Fund",
    emoji: "🖌️",
    bgColor: "bg-orange-200/60",
  },
];

const AddressPill = ({ address }: { address: string }) => (
  <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-gray-200 px-4 py-1 md:py-2">
    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
    <p className="text-[10px] md:text-xs font-medium text-gray-700">
      {address}
    </p>
  </div>
);

const PaymentLinkPill = ({
  name,
  role,
  tag,
  emoji,
  bgColor,
}: {
  name: string;
  role: string;
  tag: string;
  emoji: string;
  bgColor: string;
}) => (
  <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white pl-2 pr-3 py-1 md:py-1.5 text-[10px] md:text-xs">
    <div
      className={`flex size-3 md:size-6 items-center justify-center rounded-full ${bgColor}`}
    >
      <span>{emoji}</span>
    </div>
    <p>
      <span className="text-gray-500">vault-aptos.vercel.app /</span>{" "}
      <span className="font-semibold text-black">{name}</span>{" "}
      <span className="text-gray-500">/ {role}</span>
    </p>
    {/* <span className="ml-2 font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-md">
      {tag}
    </span> */}
  </div>
);

export default function CtaSection() {
  return (
    <section className="py-12 md:py-20 w-full flex flex-col items-center px-2 md:px-12">
      <div className="max-w-6xl w-full">
        <div className="w-full bg-gray-100 rounded-[40px] pt-12 pb-24 md:pt-20 md:pb-28 flex flex-col items-center overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight px-5 md:px-0">
            If you scrolled this far,
            <br /> Its time for you to <br className="block sm:hidden" />
            <span className="text-primary-600">VAULT IT UP!</span>
          </h2>

          <Link href="/login" className="mt-8">
            <button className="cursor-pointer bg-green-600 hover:bg-green-400 md:text-lg font-semibold rounded-2xl px-5 h-14 text-white border-none shadow-none">
              Create Your Link
            </button>
          </Link>

          <div className="mt-24 w-full relative flex items-center justify-center gap-10 md:gap-16 px-4">
            <div id="public-side" className="w-1/2">
              <Marquee className="[--duration:40s] p-0">
                {publicAddresses.map((item) => (
                  <AddressPill key={item.id} address={item.address} />
                ))}
              </Marquee>
              <div className="h-2 md:h-3"></div>
              <Marquee reverse className="[--duration:40s] p-0">
                {publicAddresses.map((item) => (
                  <AddressPill key={item.id} address={item.address} />
                ))}
              </Marquee>
            </div>

            <div id="private-side" className="w-1/2">
              <Marquee className="[--duration:50s] p-0">
                {paymentLinks.map((link) => (
                  <PaymentLinkPill key={link.id} {...link} />
                ))}
              </Marquee>
              <div className="h-2 md:h-3"></div>
              <Marquee reverse className="[--duration:50s] p-0">
                {paymentLinks.map((link) => (
                  <PaymentLinkPill key={link.id} {...link} />
                ))}
              </Marquee>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110 md:scale-125 z-10">
              {/* <HugeCloud /> */}
              <div className="w-[240px] md:w-[422px]">
                <Image
                  src={HugeCloudImage}
                  alt=""
                  width={600}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
