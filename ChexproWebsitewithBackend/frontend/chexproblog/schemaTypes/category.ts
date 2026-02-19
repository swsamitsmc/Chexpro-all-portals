import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'color',
      title: 'Display Color',
      type: 'string',
      description: 'Hex color code for category badge (e.g., #3B82F6)',
      validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/),
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
