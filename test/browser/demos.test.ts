// Runs the conformance suites against the docs site's plain HTML demos,
// which import the built package (run `npm run build` first).
import {
  checkboxGroupConformance,
  dialogConformance,
  disclosureConformance,
  fieldConformance,
  listboxConformance,
} from '../../src/core/testing/index.ts';
import { mountCheckboxGroup, mountDialog, mountDisclosure, mountField, mountListbox } from '../../site/demos/demos.js';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

function container(): HTMLElement {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}

const audit = expectNoAxeViolations;

disclosureConformance({ name: 'demo', driver, audit, mount: () => mountDisclosure(container()) });
dialogConformance({ name: 'demo', driver, audit, mount: () => mountDialog(container()) });
listboxConformance({ name: 'demo', driver, audit, mount: (spec) => mountListbox(container(), spec) });
checkboxGroupConformance({ name: 'demo', driver, audit, mount: () => mountCheckboxGroup(container()) });
fieldConformance({ name: 'demo', driver, audit, mount: () => mountField(container()) });
