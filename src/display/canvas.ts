import Backend from "./backend.js";
import { BaseDisplayOptions, DisplayData, TextDisplayOptions, UnknownBackend, DefaultsFor } from "./types.js";

/**
 * Base class for any backend that uses a `<canvas>` element as its display surface
 */
export abstract class BaseCanvas<TOptions extends BaseDisplayOptions,
								 TData extends DisplayData = DisplayData<string[], string, string>,
								 TChar = string[], TFGColor = string, TBGColor = string,
								>
						extends Backend<TOptions, TChar, TFGColor, TBGColor, TData extends DisplayData<TChar, TFGColor, TBGColor> ? TData : never> {
	_ctx: CanvasRenderingContext2D;

	constructor(oldBackend?: UnknownBackend) {
		super();
		this._ctx = oldBackend instanceof BaseCanvas ? oldBackend._ctx : document.createElement("canvas").getContext("2d")!;
	}

	schedule(cb: () => void) { requestAnimationFrame(cb); }
	getContainer() { return this._ctx.canvas; }

	setOptions(opts: TOptions) {
		let needsRepaint = super.setOptions(opts);

		if (needsRepaint) {
			this._updateSize();
		}

		return needsRepaint;
	}

	clear() {
		this._ctx.save();
		this._ctx.globalCompositeOperation = "copy"
		this._ctx.fillStyle = this._options.bg;
		this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
		this._ctx.restore();
	}

	eventToPosition(x: number, y: number): [number, number] {
		let canvas = this._ctx.canvas;
		let rect = canvas.getBoundingClientRect();
		x -= rect.left;
		y -= rect.top;
		
		x *= canvas.width / rect.width;
		y *= canvas.height / rect.height;

		if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) { return [-1, -1]; }

		return this._normalizedEventToPosition(x, y);
	}

	abstract _normalizedEventToPosition(x: number, y: number): [number, number];
	abstract _updateSize(): void;
}

export type CanvasDisplayData = DisplayData<string[], string, string>;
/**
 * Base class for text canvases, which can display one or more text characters with a single foreground and a background color in each cell.
 */
export default abstract class Canvas<TOptions extends TextDisplayOptions,
									 TData extends DisplayData = CanvasDisplayData,
									 TChar = string[], TFGColor = string, TBGColor = string,
									>
							extends BaseCanvas<TOptions, TData, TChar, TFGColor, TBGColor> {
	protected get DEFAULTS() {
		return {
			...super.DEFAULTS,
			fontSize: 15,
			spacing: 1,
			border: 0,
			fontFamily: "monospace",
			fontStyle: "",
		} satisfies DefaultsFor<TextDisplayOptions>;
	}
	setOptions(opts: TOptions) {
		const { fontSize, fontFamily, spacing } = this._options;
		let needsRepaint = super.setOptions(opts) || fontSize !== opts.fontSize || fontFamily !== opts.fontFamily || spacing !== opts.spacing;

		if (needsRepaint) {
			opts = this._options;
			const style = (opts.fontStyle ? `${opts.fontStyle} ` : ``);
			const font = `${style} ${opts.fontSize}px ${opts.fontFamily}`;
			this._ctx.font = font;
			this._updateSize();

			this._ctx.font = font;
			this._ctx.textAlign = "center";
			this._ctx.textBaseline = "middle";
		}

		return needsRepaint;
	}
}
