import { LINKS } from "@/config/links";
import Image from "next/image";

export default function FooterSection() {
  const footerColumns = [
    {
      title: "Developers",
      links: [{ label: "GitHub", href: LINKS.GITHUB }],
    },
    // {
    //   title: "Resources",
    //   links: [
    //     { label: "Audit Report", href: "#" },
    //     { label: "Changelog", href: "#" },
    //     { label: "Blog", href: "#" },
    //     { label: "FAQs", href: "#" },
    //   ],
    // },
  ];

  return (
    <footer className="w-full bg-white pt-16 ">
      <div className="max-w-6xl mx-auto p-6 md:p-10 bg-gray-50 rounded-t-[40px]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="text-2xl font-bold text-gray-900">shingru</div>
          </div>

          {footerColumns.map((column, index) => (
            <div key={index}>
              <h3 className="text-gray-900 font-medium mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8">
          <p className="text-gray-400 text-sm">©2025 shingru.inc</p>
        </div>
      </div>
    </footer>
  );
}
