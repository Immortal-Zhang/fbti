import { DIMENSIONS } from "@/data/dimensions";
import type { ShareFormat } from "@/lib/share-copy/select";
import { publicCopy, type SharePacket } from "@/lib/sharing/snapshot";
import { compareObservations } from "@/lib/friends/compare";
import { wrapText, type TextPlacement } from "./text";

export type PosterFormat = ShareFormat | "comparison";
export const POSTER_SIZES = {
  moments: [1080, 1920],
  rednote: [1080, 1440],
  comparison: [1080, 1440],
} as const;
const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const INK = "#242923",
  PAPER = "#f6f3e9",
  BLUE = "#254bfa",
  MUTED = "#5b6057";

function loadSvg(markup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    );
    const image = new Image();
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("设备插画加载超时，请重试。"));
    }, 8000);
    image.onload = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error("设备插画未能加载，请重试。"));
    };
    image.src = url;
  });
}
export async function renderPoster(
  packet: SharePacket,
  format: PosterFormat,
  artworks: readonly string[],
  host: string | null,
  signal?: AbortSignal,
) {
  const started = performance.now();
  if (format === "comparison" && packet.kind !== "compare")
    throw new Error("双视角海报需要完整观察报告。");
  if (artworks.length !== (format === "comparison" ? 2 : 1))
    throw new Error("设备插画尚未就绪。");
  await document.fonts.ready;
  if (signal?.aborted) throw new DOMException("已取消生成。", "AbortError");
  const images = await Promise.all(artworks.map(loadSvg));
  if (signal?.aborted) throw new DOMException("已取消生成。", "AbortError");
  const [width, height] = POSTER_SIZES[format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context)
    throw new Error("此浏览器无法生成图片，请换用Safari或Chrome重试。");
  const ctx = context;
  const placements: TextPlacement[] = [];
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    border = false,
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (border) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }
  };
  const line = (x: number, y: number, w: number, color = INK) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
  };
  function text(
    id: string,
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    min = size,
    weight = 500,
    color = INK,
    ratio = 1.45,
  ) {
    let chosen: TextPlacement | null = null;
    for (let fontSize = size; fontSize >= min; fontSize--) {
      ctx.font = `${weight} ${fontSize}px ${FONT}`;
      const lines = wrapText(value, w, (part) => ctx.measureText(part).width);
      const lineHeight = Math.ceil(fontSize * ratio);
      if (lines.length * lineHeight <= h) {
        chosen = {
          id,
          x,
          y,
          width: w,
          height: h,
          fontSize,
          lineHeight,
          lines,
          drawnHeight: lines.length * lineHeight,
        };
        break;
      }
    }
    if (!chosen || x < 0 || y < 0 || x + w > width || y + h > height)
      throw new Error(`海报文字未完整排入版面（${id}），请重试或切换模板。`);
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    chosen.lines.forEach((part, i) =>
      ctx.fillText(part, x, y + i * chosen!.lineHeight),
    );
    placements.push(chosen);
  }
  function header(edition: string) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    // Same original H device mark as app/icon.svg and the site header.
    ctx.save();
    ctx.translate(64, 64);
    ctx.scale(70 / 64, 70 / 64);
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(0, 0, 64, 64, 16);
    else ctx.rect(0, 0, 64, 64);
    ctx.fill();
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 10;
    ctx.stroke(new Path2D("M16 15v34m32-34v34M16 32h32"));
    ctx.fillStyle = "#d8f76b";
    ctx.beginPath();
    ctx.arc(32, 17, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    text("brand", "你哪个厂的？", 156, 69, 480, 48, 32, 32, 700);
    text("company", "人类非标制造有限公司", 156, 112, 550, 32, 20);
    text("edition", edition, 746, 76, 270, 65, 23, 21, 600);
    line(64, 164, 952);
  }
  function footer(id: string) {
    line(64, height - 133, 952);
    text("public-id", id, 64, height - 112, 500, 32, 22, 18, 600);
    text(
      "entertainment",
      "原创娱乐 · 非科学认证",
      690,
      height - 112,
      326,
      32,
      22,
      20,
    );
    text(
      "site",
      host || "你哪个厂的？ · 检测你的出厂设置",
      64,
      height - 73,
      952,
      35,
      22,
      16,
      500,
      MUTED,
    );
  }
  function axes(
    scores: ReturnType<typeof publicCopy>["result"]["scores"],
    y: number,
  ) {
    DIMENSIONS.forEach((d, i) => {
      const x = 64 + i * 244;
      text(
        `axis-${d.id}`,
        `${d.name}  ${scores[d.id]}`,
        x,
        y,
        220,
        40,
        26,
        24,
        650,
      );
      rect(x, y + 51, 210, 6, "#d5d5c8");
      rect(x, y + 51, Math.max(3, scores[d.id] * 2.1), 6, BLUE);
      text(
        `axis-poles-${d.id}`,
        `${d.lowLabel} ↔ ${d.highLabel}`,
        x,
        y + 74,
        218,
        60,
        18,
        17,
        500,
        MUTED,
      );
    });
  }
  if (format === "comparison" && packet.kind === "compare") {
    const report = compareObservations(packet.self.scores, packet.observer);
    header("双视角观察报告\nFIELD NOTES / 03");
    text(
      "headline",
      "我以为的我\n朋友眼里的我",
      64,
      198,
      952,
      142,
      48,
      46,
      750,
      INK,
      1.3,
    );
    const identities = [report.self, report.observer];
    identities.forEach((identity, i) => {
      const x = i === 0 ? 64 : 568;
      rect(x, 365, 448, 320, identity.device.color);
      ctx.drawImage(images[i], x + 30, 347, 388, 323);
      text(
        `side-${i}`,
        i === 0 ? "本人自评 · 20题" : "朋友观察 · 8题",
        x + 18,
        327,
        420,
        38,
        25,
        25,
        650,
      );
      text(
        `model-${i}`,
        identity.device.name,
        x + 18,
        693,
        420,
        58,
        37,
        31,
        750,
      );
    });
    rect(64, 778, 952, 107, INK);
    text("sync-label", "认知同步率", 92, 812, 285, 45, 29, 29, 600, PAPER);
    text(
      "sync",
      `${report.synchronization}%`,
      540,
      788,
      430,
      88,
      66,
      60,
      750,
      PAPER,
      1.15,
    );
    report.dimensions.forEach((d, i) => {
      const x = 64 + (i % 2) * 504,
        y = 917 + Math.floor(i / 2) * 94;
      text(
        `compare-axis-${d.id}`,
        `${d.name}    ${d.self} / ${d.observer}`,
        x,
        y,
        448,
        35,
        24,
        23,
        650,
      );
      rect(x, y + 42, 448, 5, "#dddccf");
      rect(x, y + 42, Math.max(3, d.self * 4.48), 5, BLUE);
      rect(x, y + 56, 448, 5, "#dddccf");
      rect(x, y + 56, Math.max(3, d.observer * 4.48), 5, INK);
    });
    text(
      "axis-legend",
      "蓝线：本人自评  /  墨线：朋友观察",
      64,
      1101,
      952,
      32,
      20,
      20,
      500,
      MUTED,
    );
    text("incident", report.summary, 64, 1150, 952, 109, 31, 24, 650, INK, 1.4);
    text(
      "comparison-boundary",
      "只比较本次坐标，不衡量友情；两台设备描述同一个人。",
      64,
      1270,
      952,
      31,
      22,
      20,
    );
    footer(report.code);
  } else {
    const selected = publicCopy(packet.self, format as ShareFormat);
    const long = format === "moments";
    header(
      long
        ? "人类设备出厂证书\nCERTIFICATE / 01"
        : "非标人类观察卡\nPORTRAIT / 02",
    );
    text("model-id", selected.device.id, 64, 199, 500, 38, 25, 25, 600, BLUE);
    text(
      "model-name",
      selected.device.name,
      64,
      250,
      560,
      112,
      70,
      56,
      750,
      INK,
      1.25,
    );
    ctx.drawImage(images[0], 598, 214, 414, 345);
    text(
      "description",
      selected.description,
      64,
      374,
      514,
      150,
      29,
      23,
      500,
      INK,
      1.5,
    );
    text(
      "keywords",
      selected.tags.map((tag) => `#${tag}`).join("  "),
      64,
      528,
      952,
      42,
      25,
      22,
      600,
    );
    rect(64, 591, 952, 115, selected.device.color, true);
    text(
      "share-title",
      selected.copy.titles[0],
      90,
      612,
      900,
      80,
      50,
      40,
      750,
      selected.device.ink,
      1.3,
    );
    if (long) {
      axes(selected.result.scores, 752);
      line(64, 922, 952);
      text("fault-label", "特色故障 / 厂家口供", 64, 948, 448, 40, 25, 25, 650);
      text(
        "hidden-label",
        "隐藏功能 / 未经认领",
        568,
        948,
        448,
        40,
        25,
        25,
        650,
      );
      text(
        "faults",
        selected.copy.faults.join("\n"),
        64,
        1004,
        448,
        266,
        32,
        26,
        650,
        INK,
        1.45,
      );
      text(
        "hidden",
        selected.copy.hidden.join("\n"),
        568,
        1004,
        448,
        266,
        32,
        26,
        650,
        INK,
        1.45,
      );
      rect(64, 1304, 952, 170, "#e9e8de");
      const energy = selected.result.scores.energy;
      const charge =
        energy < 40
          ? "把人类接口暂时拔掉，让安静给机身慢慢充电。"
          : energy > 60
            ? "接上合拍的人类，闲聊也是合法的电能来源。"
            : "独处与陪伴轮流供电，今天用哪个插座由本人决定。";
      text("charge-label", "充电方式", 84, 1322, 410, 35, 23, 23, 650);
      text("charging", charge, 84, 1363, 410, 101, 26, 22, 550, INK, 1.4);
      text("warning-label", "荒诞使用警告", 588, 1322, 406, 35, 23, 23, 650);
      text(
        "warning",
        selected.copy.warnings[0],
        588,
        1363,
        406,
        101,
        26,
        22,
        550,
        INK,
        1.4,
      );
      text(
        "warranty-label",
        "终身保修 / 凭本人即可",
        64,
        1512,
        952,
        38,
        24,
        24,
        650,
      );
      text(
        "warranty",
        selected.warranty,
        64,
        1562,
        952,
        111,
        28,
        23,
        500,
        INK,
        1.4,
      );
      text(
        "summary",
        selected.copy.summaries[0],
        64,
        1702,
        952,
        82,
        35,
        28,
        700,
        INK,
        1.2,
      );
    } else {
      text("fault-label", "特色故障 / 厂家口供", 64, 748, 448, 36, 24, 24, 650);
      text(
        "hidden-label",
        "隐藏功能 / 未经认领",
        568,
        748,
        448,
        36,
        24,
        24,
        650,
      );
      text(
        "faults",
        selected.copy.faults[0],
        64,
        799,
        448,
        176,
        35,
        29,
        650,
        INK,
        1.45,
      );
      text(
        "hidden",
        selected.copy.hidden[0],
        568,
        799,
        448,
        176,
        35,
        29,
        650,
        INK,
        1.45,
      );
      rect(64, 1003, 952, 127, "#e9e8de", true);
      text(
        "warning-label",
        "使用警告 / 厂家补充条款",
        86,
        1017,
        900,
        32,
        22,
        22,
        600,
      );
      text(
        "warning",
        selected.copy.warnings[0],
        86,
        1058,
        900,
        61,
        30,
        24,
        600,
        INK,
        1.2,
      );
      text(
        "summary",
        selected.copy.summaries[0],
        64,
        1164,
        952,
        112,
        39,
        29,
        750,
        INK,
        1.4,
      );
    }
    footer(selected.publicId);
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("PNG生成失败，请重试。")),
      "image/png",
    ),
  );
  // Release the eight-megabyte backing surface; the generated PNG is retained until its preview is replaced.
  canvas.width = 1;
  canvas.height = 1;
  if (signal?.aborted) throw new DOMException("已取消生成。", "AbortError");
  return {
    blob,
    width,
    height,
    placements,
    elapsedMs: Math.round(performance.now() - started),
  };
}
