import midi from "midi";
import { EventEmitter } from "events";
import { DeviceFilter, RawMessage, MidiMessageEvent } from "../types";
import { findMatch, logger, getMessageType, getMessageEvent } from "..";

export class Input extends EventEmitter {
  private midi: typeof midi.Input;

  constructor(filter: DeviceFilter, virtual = false) {
    super();
    this.midi = new midi.input();
    const { name, port } = filter;
    if (virtual) {
      // TODO: create virtual input
    } else {
      if (name === undefined && port === undefined) {
        throw Error("you must define either a name or a portNumber");
      }

      const match = findMatch(this.midi, filter);

      if (match === undefined) {
        logger.error("could not find MIDI device matching filter", {
          name,
          port
        });
        throw Error("could not find midi device");
      }

      logger.info("found matching MIDI device:", match);

      this.midi.openPort(match.port);
      setTimeout(() => {
        this.emit("ready", match);
      });

      this.midi.on("message", this.handleMessage);
    }
  }

  private handleMessage = (deltaTime: number, bytes: number[]) => {
    logger.debug("handleMessage:", deltaTime, bytes);
    const rawPayload: RawMessage = { deltaTime, bytes };
    this.emit("rawMessage", rawPayload);

    const messageType = getMessageType(bytes);

    const e: MidiMessageEvent = getMessageEvent(messageType, bytes);

    this.emit(e.name, e.payload);
  };
}