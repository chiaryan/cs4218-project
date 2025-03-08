import connectDB from './db';
import mongoose from 'mongoose';

jest.mock('mongoose');

describe("connectDB test", () => {
  const logSpy = jest.spyOn(console, 'log');
  beforeEach(() => {
    jest.clearAllMocks();
  })
  test("should log success message", async () => {
    mongoose.connect = jest.fn().mockResolvedValue({
      connection: {
        host: 'localhost'
      }
    });

    await connectDB();

    expect(logSpy).toHaveBeenCalledWith('Connected To Mongodb Database localhost'.bgMagenta.white);
  })

  test("should log error message", async () => {
    mongoose.connect = jest.fn().mockRejectedValue(new Error('connection failed'));

    await connectDB();

    expect(logSpy).toHaveBeenCalledWith('Error in Mongodb Error: connection failed'.bgRed.white);
  })
})