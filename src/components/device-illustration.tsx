import { useId } from "react";
import type { DeviceShape } from "@/lib/domain";

interface Props {
  shape: DeviceShape;
  color: string;
  name: string;
  className?: string;
  decorative?: boolean;
}

/** Original vector family: each device has its own silhouette and controls. */
export function DeviceIllustration({
  shape,
  color,
  name,
  className = "",
  decorative = false,
}: Props) {
  const titleId = useId();
  const screen = (x: number, y: number, w: number, h: number, face = true) => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill="#263936"
        strokeWidth="3"
      />
      <path
        d={`M${x + 10} ${y + 10}h${w - 20}`}
        opacity=".22"
        stroke="#d9f5b4"
      />
      {face ? (
        <g stroke="#daf5a7" strokeWidth="5" strokeLinecap="round">
          <path d={`M${x + w * 0.35} ${y + h * 0.38}v8m${w * 0.3} -8v8`} />
          <path
            d={`M${x + w * 0.38} ${y + h * 0.68}q${w * 0.12} 9 ${w * 0.24} 0`}
            fill="none"
          />
        </g>
      ) : (
        <g stroke="#daf5a7" fill="none" strokeWidth="3">
          <path
            d={`M${x + 12} ${y + h / 2}h${w * 0.15}l8 -14 14 28 10 -20h${w * 0.2}`}
          />
          <circle cx={x + w - 16} cy={y + 15} r="3" fill="#daf5a7" />
        </g>
      )}
    </g>
  );
  const bolt = (x: number, y: number) => (
    <g>
      <circle cx={x} cy={y} r="4" fill="#f6f3e9" strokeWidth="1.5" />
      <path d={`M${x - 2} ${y + 2}l4 -4`} strokeWidth="1" />
    </g>
  );
  const knob = (x: number, y: number, r = 12) => (
    <g>
      <circle cx={x + 2} cy={y + 3} r={r} fill="#202723" />
      <circle cx={x} cy={y} r={r} fill="#f6f3e9" strokeWidth="2.5" />
      <path d={`M${x} ${y - r + 4}v5`} strokeWidth="2.5" />
    </g>
  );
  const vents = (x: number, y: number, count = 5) => (
    <g strokeWidth="3" strokeLinecap="round">
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={`M${x + i * 8} ${y}v14`} />
      ))}
    </g>
  );
  let body: React.ReactNode;
  switch (shape) {
    case "archive":
      body = (
        <>
          <rect x="94" y="55" width="172" height="196" rx="16" fill={color} />
          <rect x="108" y="70" width="144" height="50" rx="7" fill="#f1e7cb" />
          <path d="M119 85h60m-60 14h92" strokeWidth="3" />
          <rect x="109" y="132" width="142" height="48" rx="6" fill="#f6f3e9" />
          <rect x="160" y="144" width="40" height="10" rx="3" fill={color} />
          <rect x="109" y="189" width="142" height="46" rx="6" fill="#f6f3e9" />
          <rect x="160" y="201" width="40" height="10" rx="3" fill={color} />
          {bolt(103, 63)}
          {bolt(257, 63)}
        </>
      );
      break;
    case "beacon":
      body = (
        <>
          <path d="M174 39v45m12 -45v45" />
          <path
            d="M145 53q35 -29 70 0m-82 -17q47 -37 94 0"
            fill="none"
            strokeDasharray="4 6"
          />
          <rect x="119" y="87" width="122" height="139" rx="42" fill={color} />
          {screen(137, 108, 86, 69)}
          <path d="M149 196h62" strokeWidth="5" />
          <path d="M111 226h138l15 24H96z" fill="#f1e7cb" />
        </>
      );
      break;
    case "terrarium":
      body = (
        <>
          <path
            d="M103 196V118a77 77 0 0 1 154 0v78"
            fill={color}
            fillOpacity=".32"
          />
          <path
            d="M118 125q0 -58 52 -65"
            fill="none"
            stroke="#fff"
            strokeWidth="7"
          />
          <path
            d="M181 196v-59m0 24q-43 0 -42 -36 40 -4 42 36m0 -14q42 -2 39 -35 -36 -1 -39 35"
            fill={color}
          />
          <rect x="91" y="191" width="178" height="55" rx="12" fill={color} />
          {knob(225, 219)}
          <path d="M109 216h52m-52 10h31" strokeWidth="3" />
        </>
      );
      break;
    case "radar":
      body = (
        <>
          <path d="M121 208l-15 36m133 -36 15 36" strokeWidth="9" />
          <rect x="89" y="59" width="182" height="160" rx="23" fill={color} />
          <circle cx="180" cy="132" r="59" fill="#263936" />
          <g stroke="#daf5a7" fill="none" strokeWidth="2">
            <circle cx="180" cy="132" r="39" />
            <circle cx="180" cy="132" r="20" />
            <path d="M121 132h118m-59 -59v118m0 -59 36 -37" />
            <circle cx="205" cy="108" r="5" fill="#daf5a7" />
          </g>
          {bolt(103, 73)}
          {bolt(257, 73)}
          <path d="M152 205h56" strokeWidth="3" />
        </>
      );
      break;
    case "kettle":
      body = (
        <>
          <path d="M245 117q68 -8 38 84h-38" fill="none" strokeWidth="14" />
          <path d="M107 135l-36 -28 12 66 29 20" fill={color} />
          <path
            d="M125 95h98l29 123q3 28 -27 28H118q-26 0 -22 -28z"
            fill={color}
          />
          <path d="M118 94h111l-12 -16h-87z" fill="#f1e7cb" />
          {knob(173, 73, 10)}
          {screen(127, 134, 91, 65)}
          <path
            d="M147 40q-12 -12 0 -24m35 33q-12 -12 0 -24"
            fill="none"
            strokeDasharray="4 5"
          />
        </>
      );
      break;
    case "radio":
      body = (
        <>
          <path d="M115 92V67q65 -30 130 0v25" fill="none" strokeWidth="9" />
          <path d="M237 58l38 -41" strokeWidth="5" />
          <rect x="65" y="92" width="230" height="145" rx="18" fill={color} />
          <circle cx="128" cy="163" r="47" fill="#f6f3e9" />
          <circle cx="128" cy="163" r="34" fill="#d3d1c7" />
          <path
            d="M106 143h44m-51 10h58m-60 11h60m-57 11h54m-46 10h38"
            strokeWidth="3"
          />
          {screen(193, 110, 82, 43, false)}
          {knob(211, 193, 14)}
          {knob(255, 193, 11)}
        </>
      );
      break;
    case "projector":
      body = (
        <>
          <path
            d="M262 119l61 -33v124l-61 -33"
            fill={color}
            fillOpacity=".13"
            strokeDasharray="5 5"
          />
          <rect x="87" y="103" width="172" height="117" rx="15" fill={color} />
          <circle cx="130" cy="78" r="33" fill="#f6f3e9" />
          <circle cx="207" cy="71" r="40" fill="#f6f3e9" />
          <circle cx="130" cy="78" r="12" fill={color} />
          <circle cx="207" cy="71" r="15" fill={color} />
          <rect x="251" y="129" width="25" height="48" rx="6" fill="#263936" />
          {screen(105, 128, 90, 60)}
          {vents(212, 151, 4)}
          <path d="M116 220l-10 26m123 -26 10 26" strokeWidth="7" />
        </>
      );
      break;
    case "capsule":
      body = (
        <>
          <path d="M180 49V26m-9 0h18" />
          <rect x="115" y="50" width="130" height="200" rx="65" fill={color} />
          {screen(133, 86, 94, 77)}
          <path d="M128 188h104" />
          <circle cx="180" cy="210" r="15" fill="#f6f3e9" />
          <path d="M173 210h14m-7 -7v14" strokeWidth="3" />
          <path d="M101 134l-17 9v50h20m151 -59 17 9v50h-20" fill="#f1e7cb" />
        </>
      );
      break;
    case "console":
      body = (
        <>
          <path d="M82 53h196l-8 151H90z" fill={color} strokeWidth="3" />
          <path d="M93 66h173l-6 124H100z" fill="#ece7d9" />
          {screen(112, 79, 136, 94)}
          <path d="M90 204h180l24 42H66z" fill={color} />
          <path
            d="M103 218h92m-103 12h114"
            stroke="#f6f3e9"
            strokeWidth="6"
            strokeDasharray="9 5"
          />
          {knob(244, 226, 11)}
          {bolt(91, 61)}
          {bolt(269, 61)}
          <path d="M99 251v8m162 -8v8" strokeWidth="8" />
        </>
      );
      break;
    case "router":
      body = (
        <>
          <path d="M114 111L96 38m148 73 20 -73" strokeWidth="8" />
          <rect x="75" y="112" width="210" height="115" rx="18" fill={color} />
          {screen(94, 133, 110, 70)}
          <circle cx="247" cy="145" r="6" fill="#daf5a7" />
          <circle cx="247" cy="170" r="6" fill="#f7a37c" />
          <circle cx="247" cy="195" r="6" fill="#f6f3e9" />
          <path
            d="M118 89q63 -49 124 0m-105 -29q44 -34 86 0"
            fill="none"
            strokeDasharray="4 6"
          />
        </>
      );
      break;
    case "sampler":
      body = (
        <>
          <path d="M80 107q100 -34 200 0v130H80z" fill={color} />
          {screen(97, 111, 115, 45, false)}
          {knob(249, 135, 17)}
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={98 + (i % 4) * 43}
              y={173 + Math.floor(i / 4) * 27}
              width="31"
              height="19"
              rx="4"
              fill={i % 3 === 0 ? "#f6a178" : "#f6f3e9"}
              strokeWidth="2"
            />
          ))}
          <path
            d="M119 80v-23m10 14h-20m121 -5v-23m10 14h-20"
            strokeWidth="3"
          />
        </>
      );
      break;
    case "satellite":
      body = (
        <>
          <path
            d="M127 137l-64 -27 -21 61 65 26m126 -60 64 -27 21 61 -65 26"
            fill={color}
          />
          <path
            d="M75 117l-20 59m43 -49 -21 58m186 -68 20 59m-43 -49 21 58M54 140l62 25m128 0 62 -25"
            stroke="#f6f3e9"
            strokeWidth="2"
          />
          <rect
            x="120"
            y="106"
            width="120"
            height="111"
            rx="18"
            fill="#f1e7cb"
          />
          {screen(137, 123, 86, 68)}
          <path d="M180 106V81m-40 -34q40 73 80 0z" fill={color} />
          <path d="M180 60V26m-9 0h18" />
          <path d="M160 217l-7 22h54l-7 -22" fill={color} />
        </>
      );
      break;
    case "printer":
      body = (
        <>
          <path d="M121 103V39h119v64" fill="#f6f3e9" />
          <path d="M137 58h78m-78 14h57m-57 14h69" strokeWidth="3" />
          <rect x="78" y="100" width="204" height="119" rx="17" fill={color} />
          {knob(251, 126, 10)}
          <rect x="101" y="150" width="158" height="16" rx="6" fill="#263936" />
          <path
            d="M119 158h122v93l-12 -7 -12 7 -12 -7 -12 7 -12 -7 -12 7 -12 -7 -12 7 -12 -7 -14 7z"
            fill="#f6f3e9"
          />
          <path d="M138 180h83m-83 13h59m-59 13h72m-72 13h45" strokeWidth="3" />
          <circle cx="106" cy="121" r="5" fill="#daf5a7" />
        </>
      );
      break;
    case "mixer":
      body = (
        <>
          <path d="M107 66h146l38 180H69z" fill={color} />
          {screen(121, 81, 117, 47, false)}
          {[128, 163, 198, 233].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 149v73`} strokeWidth="5" />
              <rect
                x={x - 9}
                y={165 + (i % 3) * 13}
                width="18"
                height="12"
                rx="3"
                fill="#f6f3e9"
                strokeWidth="2"
              />
            </g>
          ))}
          <path d="M150 66V46q30 -30 60 0v20" fill="none" strokeWidth="7" />
        </>
      );
      break;
    case "rover":
      body = (
        <>
          <circle cx="116" cy="223" r="29" fill="#263936" />
          <circle cx="244" cy="223" r="29" fill="#263936" />
          <circle cx="116" cy="223" r="12" fill="#f6f3e9" />
          <circle cx="244" cy="223" r="12" fill="#f6f3e9" />
          <path d="M81 202l16 -70h166l16 70z" fill={color} />
          <path d="M167 132V99h26v33" fill="#f1e7cb" />
          <rect x="121" y="52" width="118" height="65" rx="26" fill={color} />
          <circle cx="153" cy="84" r="15" fill="#263936" />
          <circle cx="207" cy="84" r="15" fill="#263936" />
          <circle cx="156" cy="81" r="4" fill="#daf5a7" />
          <circle cx="210" cy="81" r="4" fill="#daf5a7" />
          {vents(148, 164, 9)}
          <path d="M218 52l13 -23" strokeWidth="4" />
        </>
      );
      break;
    case "jukebox":
      body = (
        <>
          <path d="M100 248V124a80 80 0 0 1 160 0v124z" fill={color} />
          <path d="M117 232V124a63 63 0 0 1 126 0v108z" fill="#f1e7cb" />
          <path d="M132 128a48 48 0 0 1 96 0z" fill="#263936" />
          <path
            d="M145 118v-18m18 18V87m18 31V83m18 35V89m18 29v-16"
            stroke="#daf5a7"
            strokeWidth="4"
          />
          {screen(133, 144, 95, 40, false)}
          <path d="M141 203h77m-77 9h77m-77 9h77" strokeWidth="3" />
          {bolt(108, 239)}
          {bolt(252, 239)}
        </>
      );
      break;
  }
  return (
    <svg
      className={`device-illustration ${className}`}
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
    >
      {!decorative && <title id={titleId}>{`${name}的原创设备插画`}</title>}
      <ellipse
        cx="180"
        cy="262"
        rx="113"
        ry="12"
        fill="#202723"
        opacity=".09"
      />
      <g
        stroke="#26302d"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {body}
      </g>
      <path
        d="M31 53h12m-6 -6v12m278 159h12m-6 -6v12"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="302" cy="67" r="4" stroke={color} strokeWidth="2" />
    </svg>
  );
}
