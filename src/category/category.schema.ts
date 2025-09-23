import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: { createdAt: 'createdDate', updatedAt: false },
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Category {
  @ApiProperty({ name: 'id', example: '6272936ee1353fb267b81431' })
  _id: string;

  @ApiProperty({ example: 'Books' })
  @Prop({ type: String, required: true, false: true, index: true })
  slug: string;

  @ApiProperty({ example: 'Scientific literature' })
  @Prop({ type: String, required: false })
  name: string;

  @ApiProperty({ example: 'Popular science books' })
  @Prop({ type: String, required: true, default: '' })
  description: string;

  @ApiProperty()
  createdDate: Date;

  @ApiProperty()
  @Prop({ type: Boolean, required: true, index: true })
  active: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
