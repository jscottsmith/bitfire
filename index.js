import Fire from './modules/Fire';
import { Canvas } from '@gush/candybar';

const canvas = new Canvas({
    canvas: document.getElementById('canvas'),
    container: document.getElementById('container'),
    hasPointer: true,
    pauseInBackground: true,
    entities: [new Fire()],
});
