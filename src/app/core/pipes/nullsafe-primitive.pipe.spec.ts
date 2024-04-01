import { NullsafePrimitivePipe } from './nullsafe-primitive.pipe';

describe('NullsafePrimitivePipe', () => {
  it('create an instance', () => {
    const pipe = new NullsafePrimitivePipe();
    expect(pipe).toBeTruthy();
  });
});
