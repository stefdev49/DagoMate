export const listPorts = () => {
  return ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyUSB2']
};

var currentPort = '/dev/ttyUSB0';

export { currentPort };
