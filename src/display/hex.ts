import Canvas, { CanvasDisplayData } from "./canvas.js";
import { TextDisplayOptions, DefaultsFor, DisplayOptions } from "./types.js";
import { mod } from "../util.js";

declare module "./types.js" {
	interface LayoutTypeBackendMap<TOptions extends DisplayOptions> {
		hex: Hex;
	}
}

export interface HexOptions extends TextDisplayOptions {
	layout: "hex";
	transpose?: boolean;
}
export interface HexData extends CanvasDisplayData {
}

/**
 * @class Hexagonal backend
 * @private
 */
export default class Hex extends Canvas<HexOptions, HexData> {
	protected get DEFAULTS() {
		return {
			...super.DEFAULTS,
			transpose: false
		} satisfies DefaultsFor<HexOptions>;
	}
	_spacingX = 0;
	_spacingY = 0;
	_hexSize = 0;

	checkOptions(options: DisplayOptions): options is HexOptions {
		return options.layout === "hex";
	}

	protected defaultedOptions(options: HexOptions): Required<HexOptions> {
		return {
			...this.DEFAULTS,
			...options,
		}
	}
	draw(data: HexData, clearBefore: boolean) {
		const {x, y, chars, fg, bg} = data;

		let px = [
			(x+1) * this._spacingX,
			y * this._spacingY + this._hexSize
		];
		if (this._options.transpose) { px.reverse(); }

		if (clearBefore) {
			this._ctx.fillStyle = bg;
			this._fill(px[0], px[1]);
		}

		if (!chars.length) { return; }

		this._ctx.fillStyle = fg;

		for (let i=0;i<chars.length;i++) {
			this._ctx.fillText(chars[i], px[0], Math.ceil(px[1]));
		}
	}

	computeSize(availWidth: number, availHeight: number): [number, number] {
		if (this._options.transpose) {
			availWidth += availHeight;
			availHeight = availWidth - availHeight;
			availWidth -= availHeight;
		}

		let width = Math.floor(availWidth / this._spacingX) - 1;
		let height = Math.floor((availHeight - 2*this._hexSize) / this._spacingY + 1);
		return [width, height];
	}

	computeFontSize(availWidth: number, availHeight: number) {
		if (this._options.transpose) {
			availWidth += availHeight;
			availHeight = availWidth - availHeight;
			availWidth -= availHeight;
		}

		let hexSizeWidth = 2*availWidth / ((this._options.width+1) * Math.sqrt(3)) - 1;
		let hexSizeHeight = availHeight / (2 + 1.5*(this._options.height-1));
		let hexSize = Math.min(hexSizeWidth, hexSizeHeight);

		// compute char ratio
		let oldFont = this._ctx.font;
		this._ctx.font = "100px " + this._options.fontFamily;
		let width = Math.ceil(this._ctx.measureText("W").width);
		this._ctx.font = oldFont;
		let ratio = width / 100;

		hexSize = Math.floor(hexSize)+1; // closest larger hexSize

		// FIXME char size computation does not respect transposed hexes
		let fontSize = 2*hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));

		// closest smaller fontSize
		return Math.ceil(fontSize)-1;
	}

	_normalizedEventToPosition(x: number, y: number): [number, number] {
		let nodeSize;
		if (this._options.transpose) {
			x += y;
			y = x-y;
			x -= y;
			nodeSize = this._ctx.canvas.width;
		} else {
			nodeSize = this._ctx.canvas.height;
		}
		let size = nodeSize / this._options.height;
		y = Math.floor(y/size);

		if (mod(y, 2)) { /* odd row */
			x -= this._spacingX;
			x = 1 + 2*Math.floor(x/(2*this._spacingX));
		} else {
			x = 2*Math.floor(x/(2*this._spacingX));
		}

		return [x, y];
	}

	/**
	 * Arguments are pixel values. If "transposed" mode is enabled, then these two are already swapped.
	 */
	_fill(cx: number, cy: number) {
		let a = this._hexSize;
		let b = this._options.border;
		const ctx = this._ctx;

		ctx.beginPath();

		if (this._options.transpose) {
			ctx.moveTo(cx-a+b,		cy);
			ctx.lineTo(cx-a/2+b,	cy+this._spacingX-b);
			ctx.lineTo(cx+a/2-b,	cy+this._spacingX-b);
			ctx.lineTo(cx+a-b,		cy);
			ctx.lineTo(cx+a/2-b,	cy-this._spacingX+b);
			ctx.lineTo(cx-a/2+b,	cy-this._spacingX+b);
			ctx.lineTo(cx-a+b,		cy);
		} else {
			ctx.moveTo(cx,					cy-a+b);
			ctx.lineTo(cx+this._spacingX-b,	cy-a/2+b);
			ctx.lineTo(cx+this._spacingX-b,	cy+a/2-b);
			ctx.lineTo(cx,					cy+a-b);
			ctx.lineTo(cx-this._spacingX+b,	cy+a/2-b);
			ctx.lineTo(cx-this._spacingX+b,	cy-a/2+b);
			ctx.lineTo(cx,					cy-a+b);
		}
		ctx.fill();
	}

	_updateSize() {
		const opts = this._options;
		const charWidth = Math.ceil(this._ctx.measureText("W").width);
		this._hexSize = Math.floor(opts.spacing * (opts.fontSize + charWidth/Math.sqrt(3)) / 2);
		this._spacingX = this._hexSize * Math.sqrt(3) / 2;
		this._spacingY = this._hexSize * 1.5;

		let xprop: "width" | "height";
		let yprop: "width" | "height";
		if (opts.transpose) {
			xprop = "height";
			yprop = "width";
		} else {
			xprop = "width";
			yprop = "height";
		}
		this._ctx.canvas[xprop] = Math.ceil( (opts.width + 1) * this._spacingX );
		this._ctx.canvas[yprop] = Math.ceil( (opts.height - 1) * this._spacingY + 2*this._hexSize );

	}
}
