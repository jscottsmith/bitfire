import { utils } from '@gush/candybar';

const { getRandomInt } = utils;

const CELL_WIDTH = 16;
const CELL_HEIGHT = 16;

const SPREAD_FROM = [
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'bottom',
    'left',
    'left',
    'right',
    'right',
    'top',
];
const FLAME_DEPTH = 24;
const FLAME_GRAPH = [
    [0, 'lavender'],
    [0.1, 'yellow'],
    [0.3, 'gold'],
    [0.5, 'hotpink'],
    [0.6, 'tomato'],
    [0.8, 'DarkSlateBlue'],
    [1, '#222'],
];

function createGradientArray(size, colorStops) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = 1;

    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    colorStops.forEach(args => gradient.addColorStop(...args));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, 1);

    return Array(size)
        .fill(null)
        .map((_, x) => {
            const data = ctx.getImageData(x, 0, 1, 1).data;
            return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        });
}

class Pixel {
    constructor(x, y, arr, idx) {
        this.x = x;
        this.y = y;
        this.idx = idx;
        this.arr = arr;
    }

    setSides({ top, left, bottom, right }) {
        this.top = top;
        this.left = left;
        this.bottom = bottom;
        this.right = right;
    }

    draw = ({ ctx }) => {
        const fill = this.arr[this.idx];
        ctx.fillStyle = fill;
        ctx.fillRect(this.x, this.y, CELL_WIDTH, CELL_HEIGHT);
    };

    update = () => {
        const side = SPREAD_FROM[getRandomInt(0, SPREAD_FROM.length - 1)];
        const dest = this[side];

        // check if it can dest to designated side
        if (dest && dest.idx < this.idx) {
            const rand = getRandomInt(-1, 4);
            this.idx = dest.idx + rand;
        } else {
            this.idx += 1;
        }

        // resets if overflow
        if (this.idx > this.arr.length - 1) {
            this.idx = this.arr.length - 1;
        } else if (this.idx < 0) {
            this.idx = 0;
        }
    };
}

class Matrix {
    createMatrix(bounds) {
        const colors = createGradientArray(FLAME_DEPTH, FLAME_GRAPH);

        this.rows = Math.ceil(bounds.h / CELL_HEIGHT);
        this.columns = Math.ceil(bounds.w / CELL_WIDTH);
        const table = Array(this.rows).fill(Array(this.columns).fill(null));

        this.pixels = table.map((row, y) =>
            row.map(
                (col, x) =>
                    new Pixel(
                        x * CELL_WIDTH,
                        y * CELL_HEIGHT,
                        colors,
                        y >= this.rows - 2 ? 0 : colors.length - 1
                    )
            )
        );

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const bounds = {
                    top: this.pixels[row - 1] && this.pixels[row - 1][col],
                    left: this.pixels[row][col - 1],
                    bottom: this.pixels[row + 1] && this.pixels[row + 1][col],
                    right: this.pixels[row][col + 1],
                };

                this.pixels[row][col].setSides(bounds);
            }
        }
    }

    setup = ({ bounds }) => this.createMatrix(bounds);

    resize = ({ bounds }) => this.createMatrix(bounds);

    draw = ({ ctx, pointer, tick, bounds }) => {
        const { x, y } = pointer.position;
        let pointCol; let pointRow;
        if (x !== null && y !== null) {
            // pointer
            pointCol = Math.floor(x / CELL_WIDTH);
            pointRow = Math.floor(y / CELL_HEIGHT);
        } else {
            // demo circle
            const z = tick / 10;
            const s = bounds.h / 4;
            const { center: c } = bounds;
            pointCol = Math.floor((c.x + Math.sin(z) * s) / CELL_WIDTH);
            pointRow = Math.floor((c.y + Math.cos(z) * s) / CELL_HEIGHT);
        }

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const pixel = this.pixels[row][col];
                if (pointRow === row && pointCol === col) {
                    pixel.idx = 0;
                }

                pixel.draw({ ctx });
                pixel.update();
            }
        }
    };
}

export default Matrix;
