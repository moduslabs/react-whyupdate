import React, { useEffect, useState } from 'react';
import { create } from 'react-test-renderer';
import useWhyUpdate from './index';

const log = jest.spyOn(console, 'log').mockImplementation();

const HINT_REGXP = /opportunity for improvement/;

const ThreeUpdates = (props = {}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count < 3) {
      setCount(count + 1);
    }
  }, [count]);
  useWhyUpdate(props, { count });

  return <div>{count}</div>;
};

const NoState = props => {
  useWhyUpdate(props);
  return <div>Nothing happening here</div>;
};

const pause = (timeout = 1000) =>
  new Promise(res =>
    setTimeout(() => {
      expect(true).toBe(true);
      res();
    }, timeout)
  );

const countHints = output => output.filter(([line1]) => line1.match(HINT_REGXP));

describe('useWhyChange', () => {
  it('stays quiet if updates never happen', () => {
    create(<NoState />);
    expect(log).toHaveBeenCalledTimes(0);
  });

  it(`renders with three state updates`, async () => {
    create(<ThreeUpdates />);
    // give it a cycle to process updates
    await pause(100);
    // log called once for each update (3) and another time for the warning
    expect(log).toHaveBeenCalledTimes(3);
    // clear any stale timeouts
    Array.from(new Array(10), (_, idx) => clearTimeout(idx));
    log.mockClear();
  });

  it(`shows _too many updates_ hint`, async () => {
    create(<ThreeUpdates />);
    await pause(1200);

    expect(countHints(log.mock.calls)).toHaveLength(1);
    log.mockClear();
  });
});
