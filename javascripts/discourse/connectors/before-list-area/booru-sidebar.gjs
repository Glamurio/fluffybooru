import BooruSidebar from "../../components/booru-sidebar";
import booruState from "../../lib/booru-state";

<template>
  {{#if booruState.enabled}}
    <BooruSidebar />
  {{/if}}
</template>
